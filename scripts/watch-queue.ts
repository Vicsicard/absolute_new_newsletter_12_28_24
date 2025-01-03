import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import type { Database } from '../types/database';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

type QueueItem = Database['public']['Tables']['newsletter_generation_queue']['Row'];
type Newsletter = Database['public']['Tables']['newsletters']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function watchQueue() {
  console.log(chalk.blue('Watching for new queue items...'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));

  const subscription = supabase
    .channel('queue-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'newsletter_generation_queue'
      },
      async (payload: { 
        new: QueueItem | null; 
        old: QueueItem | null;
      }) => {
        const { new: newRecord, old: oldRecord } = payload;
        
        if (!newRecord) return;

        // Get newsletter info
        const { data: newsletter } = await supabase
          .from('newsletters')
          .select('*, company:companies(*)')
          .eq('id', newRecord.newsletter_id)
          .single();

        if (!newsletter) return;

        const companyName = newsletter.company?.company_name || 'Unknown Company';
        const timestamp = new Date().toLocaleTimeString();

        // Log different events based on status changes
        if (!oldRecord) {
          // New queue item
          console.log(chalk.green(`[${timestamp}] New queue item for ${companyName}:`));
          console.log(chalk.gray(`  Section: ${newRecord.section_type}`));
          console.log(chalk.gray(`  Status: ${newRecord.status}\n`));
        } else if (newRecord.status !== oldRecord.status) {
          // Status change
          const color = newRecord.status === 'completed' ? 'green' 
            : newRecord.status === 'failed' ? 'red'
            : newRecord.status === 'in_progress' ? 'yellow'
            : 'blue';

          console.log(chalk[color](`[${timestamp}] Status change for ${companyName}:`));
          console.log(chalk.gray(`  Section: ${newRecord.section_type}`));
          console.log(chalk.gray(`  Old status: ${oldRecord.status}`));
          console.log(chalk.gray(`  New status: ${newRecord.status}`));
          
          if (newRecord.error_message) {
            console.log(chalk.red(`  Error: ${newRecord.error_message}`));
          }
          console.log();
        }

        // If status is completed, check if all sections are done
        if (newRecord.status === 'completed') {
          const { data: queueItems } = await supabase
            .from('newsletter_generation_queue')
            .select('status')
            .eq('newsletter_id', newRecord.newsletter_id);

          const allCompleted = queueItems?.every(item => item.status === 'completed');
          
          if (allCompleted) {
            console.log(chalk.green.bold(`[${timestamp}] 🎉 All sections completed for ${companyName}!\n`));
          }
        }
      }
    )
    .subscribe();

  // Also do an initial check for any pending items
  const { data: pendingItems } = await supabase
    .from('newsletter_generation_queue')
    .select('*, newsletter:newsletters(company:companies(company_name))')
    .or('status.eq.pending,status.eq.in_progress');

  if (pendingItems && pendingItems.length > 0) {
    console.log(chalk.yellow('Current pending/in-progress items:'));
    for (const item of pendingItems) {
      const companyName = item.newsletter?.company?.company_name || 'Unknown Company';
      console.log(chalk.gray(`- ${companyName}: ${item.section_type} (${item.status})`));
    }
    console.log();
  } else {
    console.log(chalk.gray('No pending items in queue\n'));
  }
}

// Start watching
watchQueue();
