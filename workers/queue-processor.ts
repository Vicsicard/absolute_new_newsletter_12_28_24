import { createClient, PostgrestError } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Database } from '../types/database';
import { generateNewsletter } from '../utils/newsletter';
import { sendNewsletterDraft } from '../utils/email';
import { WorkflowState, WorkflowStepStatus } from '../types/workflow';
import { WORKFLOW_STEPS, updateWorkflowStatus, advanceWorkflow, isStepComplete } from '../utils/workflow';
import { logWorkflowEvent, logWorkflowError } from '../utils/monitoring';

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

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  section_number: number;
  status: string;
  attempts: number;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

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
  // Get the next pending item, respecting priority and workflow state
  const { data: items, error: queryError } = await supabase
    .from('newsletter_generation_queue')
    .select(`
      *,
      newsletters!inner (
        workflow:newsletter_workflows!inner (
          current_step,
          step_status
        )
      )
    `)
    .eq('status', 'pending')
    .eq('newsletters.workflow.step_status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1);

  if (queryError) {
    throw new DatabaseError('Failed to query queue items', queryError);
  }

  return items?.[0] || null;
}

async function processItemContent(item: QueueItem, workflow: any) {
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
}

async function processQueueItem(item: QueueItem): Promise<void> {
  console.log(`Processing queue item ${item.id} (${item.section_type})`);
  const startTime = Date.now();
  
  try {
    // Get workflow state
    const { data: workflow } = await supabase
      .from('newsletter_workflows')
      .select('*')
      .eq('newsletter_id', item.newsletter_id)
      .single();

    if (!workflow) {
      throw new Error('No workflow found for newsletter');
    }

    // Log step start
    await logWorkflowEvent({
      workflow_id: workflow.id,
      newsletter_id: item.newsletter_id,
      event_type: 'step_start',
      step: workflow.current_step,
      metadata: {
        queue_item_id: item.id,
        section_type: item.section_type
      }
    });

    // Validate current step
    const step = WORKFLOW_STEPS[workflow.current_step];
    if (!await step.validates(item.newsletter_id)) {
      throw new Error('Workflow validation failed');
    }

    // Update workflow status to in_progress
    await updateWorkflowStatus(workflow.id, 'in_progress');

    // Update queue item status
    await updateQueueItemStatus(item, 'in_progress');

    // Process the item
    await processItemContent(item, workflow);
    
    // Mark queue item as completed
    await updateQueueItemStatus(item, 'completed');

    // Log step completion
    await logWorkflowEvent({
      workflow_id: workflow.id,
      newsletter_id: item.newsletter_id,
      event_type: 'step_complete',
      step: workflow.current_step,
      duration_ms: Date.now() - startTime,
      metadata: {
        queue_item_id: item.id,
        section_type: item.section_type
      }
    });

    // Check if step is complete
    if (await isStepComplete(workflow)) {
      // Update workflow status
      await updateWorkflowStatus(workflow.id, 'completed');
      
      // Log workflow completion if this was the last step
      if (!WORKFLOW_STEPS[workflow.current_step].next) {
        await logWorkflowEvent({
          workflow_id: workflow.id,
          newsletter_id: item.newsletter_id,
          event_type: 'workflow_complete',
          step: workflow.current_step,
          duration_ms: Date.now() - startTime,
          metadata: {
            total_steps: Object.keys(WORKFLOW_STEPS).length
          }
        });
      } else {
        // Advance to next step
        await advanceWorkflow(workflow.id);
      }
    }
    
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    console.error(`Error processing queue item ${item.id}:`, errorInstance);
    
    // Get workflow to update
    const { data: workflow } = await supabase
      .from('newsletter_workflows')
      .select('*')
      .eq('newsletter_id', item.newsletter_id)
      .single();

    if (workflow) {
      // Determine if we should retry based on error type and attempts
      const shouldRetry = workflow.attempts < MAX_ATTEMPTS && 
        !(error instanceof OpenAIError && error.statusCode === 429);

      // Update workflow status
      await updateWorkflowStatus(
        workflow.id,
        shouldRetry ? 'pending' : 'failed',
        errorInstance
      );

      // Log workflow error
      await logWorkflowError(errorInstance, {
        workflow_id: workflow.id,
        newsletter_id: item.newsletter_id,
        step: workflow.current_step,
        metadata: {
          queue_item_id: item.id,
          section_type: item.section_type,
          attempts: workflow.attempts,
          will_retry: shouldRetry
        }
      });

      // Log workflow failure if we're not retrying
      if (!shouldRetry) {
        await logWorkflowEvent({
          workflow_id: workflow.id,
          newsletter_id: item.newsletter_id,
          event_type: 'workflow_failed',
          step: workflow.current_step,
          duration_ms: Date.now() - startTime,
          error_message: errorInstance.message,
          metadata: {
            queue_item_id: item.id,
            section_type: item.section_type,
            attempts: workflow.attempts
          }
        });
      }
    }

    // Update queue item status
    await updateQueueItemStatus(
      item,
      shouldRetry ? 'pending' : 'failed',
      errorInstance
    );

    if (!shouldRetry) {
      console.log(`Queue item ${item.id} has failed permanently after ${workflow?.attempts ?? 0} attempts`);
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

// Add health check function
async function checkWorkflowHealth(): Promise<void> {
  try {
    await detectAnomalies();
  } catch (error) {
    console.error('Failed to check workflow health:', error);
  }
}

// Run health check every 5 minutes
setInterval(checkWorkflowHealth, 5 * 60 * 1000);
