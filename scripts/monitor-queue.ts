const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');

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

type QueueItem = {
  id: number
  newsletter_id: number
  section_number: number
  status: string
  attempts: number
  section_type: string
  error_message: string | null
}

type Newsletter = {
  id: number
  status: string
  subject: string
  created_at: Date
}

async function monitorQueue() {
  try {
    // Get all active newsletters (not in final states)
    const { data: activeNewsletters, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .not('status', 'in', ['sent', 'failed'])
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
        .order('section_number', { ascending: true });

      if (queueError) {
        console.error(`Error fetching queue items for newsletter ${newsletter.id}:`, queueError);
        continue;
      }

      console.log(`\nNewsletter ID: ${newsletter.id}`);
      console.log(`Status: ${newsletter.status}`);
      console.log(`Subject: ${newsletter.subject}`);
      console.log('\nQueue Status:');
      
      if (!queueItems || queueItems.length === 0) {
        console.log('No queue items found');
        continue;
      }

      // Calculate statistics
      const total = queueItems.length;
      const completed = queueItems.filter((item: QueueItem) => item.status === 'completed').length;
      const failed = queueItems.filter((item: QueueItem) => item.status === 'failed').length;
      const inProgress = queueItems.filter((item: QueueItem) => item.status === 'in_progress').length;
      const pending = queueItems.filter((item: QueueItem) => item.status === 'pending').length;

      console.log(`Progress: ${completed}/${total} sections completed`);
      console.log(`- Completed: ${completed}`);
      console.log(`- In Progress: ${inProgress}`);
      console.log(`- Failed: ${failed}`);
      console.log(`- Pending: ${pending}`);

      // Show detailed status for each section
      console.log('\nDetailed Section Status:');
      queueItems.forEach((item: QueueItem) => {
        const status = item.status.toUpperCase().padEnd(11);
        const attempts = `(${item.attempts} attempts)`.padEnd(13);
        console.log(`Section ${item.section_number}: ${status} ${attempts} - ${item.section_type}`);
        if (item.error_message) {
          console.log(`  Error: ${item.error_message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error monitoring queue:', error);
  }
}

// Run initial check
console.log('Starting queue monitor...\n');
monitorQueue();

// Set up interval to check every 30 seconds
const MONITOR_INTERVAL = 30000;
setInterval(() => {
  console.log('\n--- Checking queue status ---');
  monitorQueue();
}, MONITOR_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping queue monitor...');
  process.exit(0);
});
