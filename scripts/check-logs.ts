import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odjvatrrqyuspcjxlnki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kanZhdHJycXl1c3BjanhsbmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA2MTMwMiwiZXhwIjoyMDUwNjM3MzAyfQ.SmLRECO23Odm3d_sLH4Om9pQFkhmWOro5-1q07K0n70';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
  // Check companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Latest Companies:', companies || [], companiesError || '');

  // Check newsletters
  const { data: newsletters, error: newslettersError } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Latest Newsletters:', newsletters || [], newslettersError || '');

  // Check newsletter sections
  const { data: sections, error: sectionsError } = await supabase
    .from('newsletter_sections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Latest Newsletter Sections:', sections || [], sectionsError || '');

  // Check generation queue
  const { data: queue, error: queueError } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Latest Generation Queue:', queue || [], queueError || '');
}

checkLogs().catch(console.error);
