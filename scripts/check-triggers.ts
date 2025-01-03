import { getSupabaseAdmin } from '@/utils/supabase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTriggers() {
  const supabase = getSupabaseAdmin();
  
  // Check triggers on newsletters table
  const { data: triggers, error } = await supabase
    .rpc('list_triggers', { table_name: 'newsletters' });
  
  if (error) {
    console.error('Error checking triggers:', error);
    return;
  }
  
  console.log('Triggers on newsletters table:', triggers);
  
  // Check if our specific trigger exists
  const queueTrigger = triggers?.find((t: any) => t.trigger_name === 'tr_create_newsletter_queue_items');
  if (queueTrigger) {
    console.log('Queue trigger is installed');
  } else {
    console.log('Queue trigger is NOT installed');
  }
}

checkTriggers().catch(console.error);
