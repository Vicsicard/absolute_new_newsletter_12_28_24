// Check newsletter generation queue status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQueue() {
  try {
    // Get the latest newsletter
    const { data: latestNewsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select(`
        *,
        company:companies (*),
        newsletter_sections (*),
        newsletter_generation_queue (*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (newsletterError) {
      console.error('Error fetching latest newsletter:', newsletterError);
      return;
    }

    console.log('Latest Newsletter:', JSON.stringify(latestNewsletter, null, 2));

    // Get all sections for this newsletter
    const { data: sections, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', latestNewsletter.id)
      .order('section_number', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
    } else {
      console.log('Newsletter Sections:', JSON.stringify(sections, null, 2));
    }

    // Get all queue items for this newsletter
    const { data: queue, error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', latestNewsletter.id)
      .order('section_number', { ascending: true });

    if (queueError) {
      console.error('Error fetching queue:', queueError);
    } else {
      console.log('Generation Queue:', JSON.stringify(queue, null, 2));
    }

    // Check for any failed queue items
    const { data: failedItems, error: failedError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', latestNewsletter.id)
      .eq('status', 'failed');

    if (failedError) {
      console.error('Error checking failed items:', failedError);
    } else if (failedItems?.length > 0) {
      console.log('Failed Queue Items:', JSON.stringify(failedItems, null, 2));
    }

    // Check for in-progress items
    const { data: inProgressItems, error: inProgressError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', latestNewsletter.id)
      .eq('status', 'in_progress');

    if (inProgressError) {
      console.error('Error checking in-progress items:', inProgressError);
    } else if (inProgressItems?.length > 0) {
      console.log('In Progress Items:', JSON.stringify(inProgressItems, null, 2));
    }

  } catch (error) {
    console.error('Error in checkQueue:', error);
  }
}

checkQueue();
