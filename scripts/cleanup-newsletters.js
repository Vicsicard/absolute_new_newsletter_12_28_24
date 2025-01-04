// Newsletter Cleanup Script
// Created: 2025-01-04
// Purpose: Clean up old newsletter data for testing

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupNewsletters() {
  console.log('Starting newsletter cleanup...');

  try {
    // Get all newsletter IDs
    const { data: newsletters } = await supabase
      .from('newsletters')
      .select('id');

    const newsletterIds = newsletters?.map(n => n.id) || [];
    
    if (newsletterIds.length > 0) {
      // Delete queue items first (due to foreign key constraints)
      console.log('Deleting queue items...');
      const { data: queueItems, error: queueError } = await supabase
        .from('newsletter_generation_queue')
        .delete()
        .in('newsletter_id', newsletterIds)
        .select();

      if (queueError) {
        console.error('Error deleting queue items:', queueError);
      } else {
        console.log(`Deleted ${queueItems?.length || 0} queue items`);
      }

      // Delete sections next
      console.log('Deleting newsletter sections...');
      const { data: sections, error: sectionsError } = await supabase
        .from('newsletter_sections')
        .delete()
        .in('newsletter_id', newsletterIds)
        .select();

      if (sectionsError) {
        console.error('Error deleting sections:', sectionsError);
      } else {
        console.log(`Deleted ${sections?.length || 0} sections`);
      }

      // Delete newsletters
      console.log('Deleting newsletters...');
      const { data: deletedNewsletters, error: newslettersError } = await supabase
        .from('newsletters')
        .delete()
        .in('id', newsletterIds)
        .select();

      if (newslettersError) {
        console.error('Error deleting newsletters:', newslettersError);
      } else {
        console.log(`Deleted ${deletedNewsletters?.length || 0} newsletters`);
      }
    } else {
      console.log('No newsletters found to delete');
    }

    // Delete test companies
    console.log('Deleting test companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .delete()
      .like('company_name', 'Test Company%')
      .select();

    if (companiesError) {
      console.error('Error deleting test companies:', companiesError);
    } else {
      console.log(`Deleted ${companies?.length || 0} test companies`);
    }

    // Get current counts
    const counts = await Promise.all([
      supabase.from('newsletter_generation_queue').select('id', { count: 'exact' }),
      supabase.from('newsletter_sections').select('id', { count: 'exact' }),
      supabase.from('newsletters').select('id', { count: 'exact' }),
      supabase.from('companies').select('id', { count: 'exact' })
    ]);

    console.log('\nCurrent database status:');
    console.log('Queue items remaining:', counts[0].count);
    console.log('Sections remaining:', counts[1].count);
    console.log('Newsletters remaining:', counts[2].count);
    console.log('Companies remaining:', counts[3].count);

    console.log('\nCleanup completed!');
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
cleanupNewsletters().catch(console.error);
