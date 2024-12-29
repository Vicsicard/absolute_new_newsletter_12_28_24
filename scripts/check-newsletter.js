const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewsletter(newsletterId) {
  const { data, error } = await supabase
    .from('newsletters')
    .select(`
      *,
      company:companies(*),
      newsletter_sections(*)
    `)
    .eq('id', newsletterId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Newsletter:', JSON.stringify(data, null, 2));
}

// Use the newsletter ID from the logs
checkNewsletter('7e302d1a-35e9-4454-8502-6167db68415b');
