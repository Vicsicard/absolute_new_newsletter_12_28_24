import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Ensure required environment variables are present
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  section_number: number;
  status: string;
  error_message: string | null;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Newsletter {
  id: string;
  status: string;
  subject: string;
}

interface NewsletterSection {
  id: string;
  newsletter_id: string;
  section_number: number;
  title: string;
  content: string;
  image_prompt: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface QueueStats {
  [key: string]: number;
}

async function checkQueue() {
  try {
    // Get all active newsletters (not in final states)
    const { data: activeNewsletters, error: newsletterError } = await createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
      .from('newsletters')
      .select('*')
      .not('status', 'eq', 'sent')
      .not('status', 'eq', 'failed')
      .order('created_at', { ascending: false });

    if (newsletterError) throw newsletterError;

    if (!activeNewsletters || activeNewsletters.length === 0) {
      console.log('No active newsletters found');
      process.exit(0);
    }

    for (const newsletter of activeNewsletters as Newsletter[]) {
      // Get queue items for this newsletter
      const { data: queueItems, error: queueError } = await createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
        .from('newsletter_generation_queue')
        .select('*')
        .eq('newsletter_id', newsletter.id)
        .order('section_number', { ascending: true });

      if (queueError) throw queueError;

      console.log(`\nNewsletter ID: ${newsletter.id}`);
      console.log(`Status: ${newsletter.status}`);
      console.log(`Subject: ${newsletter.subject}`);
      
      if (!queueItems || queueItems.length === 0) {
        console.log('No queue items found\n');
        continue;
      }

      const stats = queueItems.reduce((acc: QueueStats, item: QueueItem) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\nQueue Status:');
      console.log(`Total sections: ${queueItems.length}`);
      Object.entries(stats).forEach(([status, count]) => {
        console.log(`${status}: ${count}`);
      });

      console.log('\nDetailed Status:');
      queueItems.forEach((item: QueueItem) => {
        console.log(`Section ${item.section_number}: ${item.status.toUpperCase()} (${item.attempts} attempts) - ${item.section_type}`);
        if (item.error_message) {
          console.log(`  Error: ${item.error_message}`);
        }
      });
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Error checking queue:', error);
  }
  process.exit(0);
}

async function getSupabaseAdmin() {
  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  return supabaseAdmin;
}

async function fixQueueItems(newsletterIds: string[]) {
  const supabaseAdmin = await getSupabaseAdmin();

  for (const newsletterId of newsletterIds) {
    console.log(`\nFixing queue items for newsletter ${newsletterId}...`);
    
    // Get all sections for this newsletter
    const { data: sections, error: sectionsError } = await supabaseAdmin
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', newsletterId);

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      continue;
    }

    // Get all queue items for this newsletter
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', newsletterId);

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      continue;
    }

    // For each queue item, check if section exists and update status
    for (const queueItem of (queueItems as QueueItem[])) {
      const existingSection = (sections as NewsletterSection[])?.find(s => s.section_number === queueItem.section_number);
      if (existingSection && queueItem.status === 'pending') {
        console.log(`Updating queue item ${queueItem.id} to completed (section exists)`);
        const { error: updateError } = await supabaseAdmin
          .from('newsletter_generation_queue')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        if (updateError) {
          console.error('Error updating queue item:', updateError);
        }
      }
    }
  }
}

if (process.argv[2] === 'fix') {
  const newsletterIds = [
    '2ac474af-5937-4387-bd87-68ba7fe58f01',
    '347d8086-3a42-4e62-921a-91035d2472ab'
  ];
  fixQueueItems(newsletterIds)
    .then(() => {
      console.log('\nDone fixing queue items. Running status check...');
      checkQueue();
    })
    .catch(console.error);
} else {
  checkQueue();
}
