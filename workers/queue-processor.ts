import { createClient, PostgrestError } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Database } from '../types/database';
import { generateNewsletter } from '../utils/newsletter';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Constants for error handling and retries
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_DELAY = 60000; // 1 minute
const MAX_CONSECUTIVE_ERRORS = 5;
const ERROR_COOLDOWN = 300000; // 5 minutes

// Custom error types
class QueueProcessingError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'QueueProcessingError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public pgError: PostgrestError) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class OpenAIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Initialize Supabase client with error handling
function initializeSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

const supabase = initializeSupabase();

type QueueItem = Database['public']['Tables']['newsletter_generation_queue']['Row'];

// Exponential backoff for retries
function calculateRetryDelay(attempt: number): number {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
}

async function logError(error: Error, context: Record<string, any> = {}) {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context
  });

  // Here you could also log to an external service or database
}

async function updateQueueItemStatus(
  item: QueueItem,
  status: QueueItem['status'],
  error?: Error
) {
  const updates: Database['public']['Tables']['newsletter_generation_queue']['Update'] = {
    status,
    updated_at: new Date().toISOString(),
    last_attempt_at: new Date().toISOString(),
    attempts: item.attempts + 1
  };

  if (error) {
    updates.error_message = error.message;
  }

  const { error: updateError } = await supabase
    .from('newsletter_generation_queue')
    .update(updates)
    .eq('id', item.id);

  if (updateError) {
    throw new DatabaseError('Failed to update queue item status', updateError);
  }
}

async function checkHealthAndRecover() {
  // Find items stuck in 'in_progress' state
  const { data: stuckItems, error: queryError } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('status', 'in_progress')
    .lt('last_attempt_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // 15 minutes

  if (queryError) {
    throw new DatabaseError('Failed to query stuck items', queryError);
  }

  // Reset stuck items to pending
  for (const item of stuckItems || []) {
    try {
      await updateQueueItemStatus(item, 'pending');
      console.log(`Reset stuck item ${item.id} to pending`);
    } catch (error) {
      console.error(`Failed to reset stuck item ${item.id}:`, error);
    }
  }
}

async function acquireNextQueueItem(): Promise<QueueItem | null> {
  // Get the next pending item, respecting priority
  const { data: items, error: queryError } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1);

  if (queryError) {
    throw new DatabaseError('Failed to query queue items', queryError);
  }

  return items?.[0] || null;
}

async function processQueueItem(item: QueueItem): Promise<void> {
  console.log(`Processing queue item ${item.id} (${item.section_type})`);
  
  try {
    // Update status to in_progress
    await updateQueueItemStatus(item, 'in_progress');

    // Get the newsletter data
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', item.newsletter_id)
      .single();

    if (newsletterError || !newsletter) {
      throw new Error('Failed to fetch newsletter data');
    }

    // Get the company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', newsletter.company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Failed to fetch company data');
    }

    // Generate the newsletter content
    await generateNewsletter(item.newsletter_id, undefined, {
      companyName: company.company_name,
      industry: company.industry,
      targetAudience: company.target_audience || undefined,
      audienceDescription: company.audience_description || undefined
    });
    
    // Mark as completed
    await updateQueueItemStatus(item, 'completed');
    console.log(`Successfully completed queue item ${item.id}`);
    
  } catch (error) {
    console.error(`Error processing queue item ${item.id}:`, error);
    
    // Determine if we should retry based on error type
    const shouldRetry = item.attempts < MAX_ATTEMPTS && !(error instanceof OpenAIError && error.statusCode === 429);
    
    // Update failure status
    await updateQueueItemStatus(
      item,
      shouldRetry ? 'pending' : 'failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Log the error
    await logError(
      error instanceof Error ? error : new Error(String(error)),
      {
        item_id: item.id,
        newsletter_id: item.newsletter_id,
        section_type: item.section_type,
        attempt: item.attempts
      }
    );

    if (!shouldRetry) {
      console.log(`Queue item ${item.id} has failed permanently after ${item.attempts} attempts`);
    }
  }
}

async function runWorker() {
  let consecutiveErrors = 0;
  let isRunning = true;

  while (isRunning) {
    try {
      // Check for and recover any stuck items
      await checkHealthAndRecover();

      // Get next item
      const item = await acquireNextQueueItem();

      if (!item) {
        // No items to process, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      // Process the item
      await processQueueItem(item);

      // Reset error count on successful processing
      consecutiveErrors = 0;

    } catch (error) {
      consecutiveErrors++;
      console.error('Worker error:', error);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        // Take a break if we're seeing too many errors
        console.log(`Too many consecutive errors (${consecutiveErrors}), cooling down for ${ERROR_COOLDOWN}ms`);
        await new Promise(resolve => setTimeout(resolve, ERROR_COOLDOWN));
        consecutiveErrors = 0;
      }
    }
  }
}

// Handle process signals for graceful shutdown
let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down gracefully...');
  
  try {
    // Here you could add cleanup logic
    // For example, updating any in-progress items back to pending
    const { data: inProgressItems, error: queryError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('status', 'in_progress');

    if (!queryError && inProgressItems) {
      for (const item of inProgressItems) {
        await updateQueueItemStatus(item, 'pending');
      }
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await shutdown();
});

// Run initial check
console.log('Starting queue monitor...\n');
runWorker();
