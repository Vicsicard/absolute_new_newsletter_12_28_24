import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get Supabase credentials from command line arguments
const supabaseUrl = process.env.SUPABASE_URL || 'https://odjvatrrqyuspcjxlnki.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kanZhdHJycXl1c3BjanhsbmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA2MTMwMiwiZXhwIjoyMDUwNjM3MzAyfQ.SmLRECO23Odm3d_sLH4Om9pQFkhmWOro5-1q07K0n70';

async function checkLatestNewsletter() {
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  
  // Get the latest newsletter
  const { data: newsletter, error: newsletterError } = await supabase
    .from('newsletters')
    .select(`
      *,
      company:companies(*),
      queue:newsletter_generation_queue(*)
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (newsletterError) {
    console.error('Error fetching newsletter:', newsletterError);
    process.exit(1);
  }
  
  console.log('Latest Newsletter:');
  console.log('ID:', newsletter.id);
  console.log('Created:', new Date(newsletter.created_at).toLocaleString());
  console.log('Status:', newsletter.status);
  console.log('Draft Status:', newsletter.draft_status);
  console.log('Draft Recipient:', newsletter.draft_recipient_email);
  
  console.log('\nQueue Items:');
  if (newsletter.queue?.length > 0) {
    newsletter.queue.forEach((item: any) => {
      console.log(`- ${item.section_type}: ${item.status} (${item.attempts} attempts)`);
    });
  } else {
    console.log('No queue items found');
  }
  
  console.log('\nCompany Details:');
  console.log('Name:', newsletter.company.company_name);
  console.log('Industry:', newsletter.company.industry);
  console.log('Contact Email:', newsletter.company.contact_email);
}

checkLatestNewsletter().catch(console.error);
