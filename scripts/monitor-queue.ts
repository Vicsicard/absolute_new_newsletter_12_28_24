import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type NewsletterGenerationQueueStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  status: string;
  attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Newsletter {
  id: string;
  company_id: string;
  status: string;
  subject: string;
  draft_recipient_email: string | null;
  draft_status: string | null;
  created_at: string;
  updated_at: string;
}

const MAX_RETRIES = 3;
const TIMEOUT_MINUTES = 15;

async function handleStalledItems(queueItem: QueueItem) {
  console.log(`Found stalled item: ${queueItem.id}`);
  const { error } = await supabase
    .from('newsletter_generation_queue')
    .update({
      status: 'failed',
      error_message: 'Operation timed out',
      updated_at: new Date().toISOString()
    })
    .eq('id', queueItem.id);

  if (error) {
    console.error('Failed to update stalled item:', error);
  }
}

async function retryFailedItem(queueItem: QueueItem) {
  console.log(`Retrying failed item: ${queueItem.id}`);
  const { error } = await supabase
    .from('newsletter_generation_queue')
    .update({
      status: 'pending',
      attempts: queueItem.attempts + 1,
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', queueItem.id);

  if (error) {
    console.error('Failed to retry item:', error);
  }
}

async function monitorQueue() {
  try {
    // Get all active newsletters (not in final states)
    const { data: activeNewsletters, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .neq('status', 'sent')
      .neq('status', 'failed')
      .order('created_at', { ascending: false });

    if (newsletterError) {
      console.error('Error fetching newsletters:', newsletterError);
      return;
    }

    if (!activeNewsletters || activeNewsletters.length === 0) {
      console.log('No active newsletters found');
      return;
    }

    console.log(`\nMonitoring ${activeNewsletters.length} active newsletters:\n`);

    for (const newsletter of activeNewsletters) {
      // Get queue items for this newsletter
      const { data: queueItems, error: queueError } = await supabase
        .from('newsletter_generation_queue')
        .select('*')
        .eq('newsletter_id', newsletter.id)
        .order('section_type', { ascending: true });

      if (queueError) {
        console.error(`Error fetching queue for newsletter ${newsletter.id}:`, queueError);
        continue;
      }

      if (!queueItems || queueItems.length === 0) {
        console.log(`No queue items found for newsletter ${newsletter.id}`);
        continue;
      }

      console.log(`Newsletter: ${newsletter.id}`);
      console.log(`Created: ${new Date(newsletter.created_at).toLocaleString()}`);
      console.log(`Status: ${newsletter.status.toUpperCase()}`);

      // Process each queue item
      for (const item of queueItems) {
        // Check for stalled items
        if (item.status === 'in_progress') {
          const stalledTime = new Date().getTime() - new Date(item.updated_at).getTime();
          if (stalledTime > TIMEOUT_MINUTES * 60 * 1000) {
            await handleStalledItems(item);
          }
        }

        // Handle failed items that can be retried
        if (item.status === 'failed' && item.attempts < MAX_RETRIES) {
          await retryFailedItem(item);
        }
      }

      // Calculate statistics
      const total = queueItems.length;
      const completed = queueItems.filter(item => item.status === 'completed').length;
      const failed = queueItems.filter(item => item.status === 'failed').length;
      const inProgress = queueItems.filter(item => item.status === 'in_progress').length;
      const pending = queueItems.filter(item => item.status === 'pending').length;
      const stalled = queueItems.filter(item => 
        item.status === 'in_progress' && 
        new Date().getTime() - new Date(item.updated_at).getTime() > TIMEOUT_MINUTES * 60 * 1000
      ).length;

      console.log(`Progress: ${completed}/${total} sections completed`);
      console.log(`- Completed: ${completed}`);
      console.log(`- Failed: ${failed}`);
      console.log(`- In Progress: ${inProgress}`);
      console.log(`- Pending: ${pending}`);
      console.log(`- Stalled: ${stalled}`);

      if (failed > 0) {
        const failedItems = queueItems.filter(item => item.status === 'failed');
        console.log('\nFailed items:');
        failedItems.forEach(item => {
          console.log(`- Section ${item.section_type}: ${item.error_message || 'No error message'} (Attempts: ${item.attempts}/${MAX_RETRIES})`);
        });
      }
    }
  } catch (error) {
    console.error('Unexpected error in queue monitor:', error);
  }
}

// Run initial check
console.log('Starting queue monitor...\n');
monitorQueue();

// Set up interval to check every minute
const MONITOR_INTERVAL = 60000; // 1 minute
setInterval(monitorQueue, MONITOR_INTERVAL);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping queue monitor...');
  process.exit();
});
