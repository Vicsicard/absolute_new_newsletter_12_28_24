const { getSupabaseAdmin } = require('../utils/supabase-admin');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function checkStatus() {
  const supabase = getSupabaseAdmin();

  // Get all newsletters
  const { data: newsletters, error: newsletterError } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (newsletterError) {
    console.error('Error fetching newsletters:', newsletterError);
    return;
  }

  console.log('\n=== Recent Newsletters ===');
  for (const newsletter of newsletters || []) {
    console.log(`\nNewsletter ${newsletter.id}:`);
    console.log(`Status: ${newsletter.status}`);
    console.log(`Draft Status: ${newsletter.draft_status}`);
    console.log(`Created At: ${newsletter.created_at}`);

    // Get sections for this newsletter
    const { data: sections, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', newsletter.id)
      .order('section_number', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      continue;
    }

    console.log('\nSections:');
    for (const section of sections || []) {
      console.log(`  Section ${section.section_number} (${section.section_type}):`);
      console.log(`    Status: ${section.status}`);
      console.log(`    Title: ${section.title || 'Not set'}`);
    }

    // Get queue items for this newsletter
    const { data: queueItems, error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', newsletter.id)
      .order('section_number', { ascending: true });

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      continue;
    }

    console.log('\nQueue Items:');
    for (const item of queueItems || []) {
      console.log(`  ${item.section_type}:`);
      console.log(`    Status: ${item.status}`);
      console.log(`    Attempts: ${item.attempts}`);
      if (item.error_message) {
        console.log(`    Error: ${item.error_message}`);
      }
    }
  }
}

checkStatus().catch(console.error);
