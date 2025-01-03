import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAll() {
  console.log('Starting cleanup...');

  try {
    // Delete all queue items first
    console.log('Deleting queue items...');
    const { error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (queueError) {
      throw new Error(`Failed to delete queue items: ${queueError.message}`);
    }

    // Delete all newsletter sections and their related data
    console.log('Deleting image generation history...');
    const { error: imageError } = await supabase
      .from('image_generation_history')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (imageError) {
      throw new Error(`Failed to delete image history: ${imageError.message}`);
    }

    console.log('Deleting compiled newsletters...');
    const { error: compiledError } = await supabase
      .from('compiled_newsletters')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (compiledError) {
      throw new Error(`Failed to delete compiled newsletters: ${compiledError.message}`);
    }

    console.log('Deleting newsletter sections...');
    const { error: sectionsError } = await supabase
      .from('newsletter_sections')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (sectionsError) {
      throw new Error(`Failed to delete newsletter sections: ${sectionsError.message}`);
    }

    // Delete all newsletter contacts
    console.log('Deleting newsletter contacts...');
    const { error: contactsError } = await supabase
      .from('newsletter_contacts')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (contactsError) {
      throw new Error(`Failed to delete newsletter contacts: ${contactsError.message}`);
    }

    // Delete all newsletters
    console.log('Deleting newsletters...');
    const { error: newslettersError } = await supabase
      .from('newsletters')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (newslettersError) {
      throw new Error(`Failed to delete newsletters: ${newslettersError.message}`);
    }

    // Delete all contacts
    console.log('Deleting contacts...');
    const { error: baseContactsError } = await supabase
      .from('contacts')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (baseContactsError) {
      throw new Error(`Failed to delete contacts: ${baseContactsError.message}`);
    }

    // Delete all companies
    console.log('Deleting companies...');
    const { error: companiesError } = await supabase
      .from('companies')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (companiesError) {
      throw new Error(`Failed to delete companies: ${companiesError.message}`);
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAll();
