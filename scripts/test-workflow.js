// Newsletter Workflow Test Script
// Created: 2025-01-04
// Purpose: Test and validate the newsletter generation workflow system

// Note: This script tests the following workflow components:
// 1. Company creation
// 2. Newsletter creation
// 3. Section initialization
// 4. Queue item creation
// 5. Status monitoring
//
// To run this test:
// 1. Make sure .env.local is configured
// 2. Start workflow-processor.js
// 3. Run this script with: node scripts/test-workflow.js
//
// Expected output:
// - Company and newsletter created
// - Sections initialized as pending
// - Queue items created
// - Status changes from pending -> completed
//
// Current limitations:
// - Content generation is simulated
// - No error injection for testing failure cases
// - Basic monitoring only (no timing metrics)

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateWorkflow() {
  console.log('Starting workflow simulation...\n');

  try {
    // Create test company
    console.log('Creating test company...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: `Test Company ${new Date().toISOString()}`,
        industry: 'Technology',
        target_audience: 'Developers',
        audience_description: 'Software developers and engineers',
        contact_email: 'test@example.com'
      })
      .select()
      .single();

    if (companyError) throw companyError;
    console.log('Company created:', company.company_name);

    // Create test newsletter
    console.log('\nCreating test newsletter...');
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .insert({
        company_id: company.id,
        status: 'draft',
        draft_status: 'draft',
        subject: `Test Newsletter ${new Date().toISOString()}`
      })
      .select()
      .single();

    if (newsletterError) throw newsletterError;
    console.log('Newsletter created:', newsletter.id);

    // Create sections
    console.log('\nCreating newsletter sections...');
    const sections = [
      { type: 'welcome', number: 1 },
      { type: 'industry_trends', number: 2 },
      { type: 'practical_tips', number: 3 }
    ];

    // First, delete any existing sections for this newsletter
    const { error: deleteError } = await supabase
      .from('newsletter_sections')
      .delete()
      .eq('newsletter_id', newsletter.id);

    if (deleteError) console.log('Warning: Could not delete existing sections');

    // Then create new sections
    for (const section of sections) {
      const { error: sectionError } = await supabase
        .from('newsletter_sections')
        .insert({
          newsletter_id: newsletter.id,
          section_type: section.type,
          section_number: section.number,
          status: 'pending'
        });

      if (sectionError) throw sectionError;
      console.log(`Section created: ${section.type}`);
    }

    // Create queue items
    console.log('\nCreating queue items...');
    // Delete any existing queue items for this newsletter
    const { error: deleteQueueError } = await supabase
      .from('newsletter_generation_queue')
      .delete()
      .eq('newsletter_id', newsletter.id);

    if (deleteQueueError) console.log('Warning: Could not delete existing queue items');

    for (const section of sections) {
      const { error: queueError } = await supabase
        .from('newsletter_generation_queue')
        .insert({
          newsletter_id: newsletter.id,
          section_type: section.type,
          section_number: section.number,
          status: 'pending'
        });

      if (queueError) throw queueError;
      console.log(`Queue item created: ${section.type}`);
    }

    // Monitor progress
    console.log('\nMonitoring progress...');
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isComplete && attempts < maxAttempts) {
      attempts++;

      // Check sections status
      const { data: sectionStatus } = await supabase
        .from('newsletter_sections')
        .select('section_type, status')
        .eq('newsletter_id', newsletter.id);

      console.log('\nSection Status:');
      sectionStatus?.forEach(section => {
        console.log(`${section.section_type}: ${section.status}`);
      });

      // Check queue status
      const { data: queueStatus } = await supabase
        .from('newsletter_generation_queue')
        .select('section_type, status')
        .eq('newsletter_id', newsletter.id);

      console.log('\nQueue Status:');
      queueStatus?.forEach(item => {
        console.log(`${item.section_type}: ${item.status}`);
      });

      // Check if all sections are complete
      const allComplete = sectionStatus?.every(section => section.status === 'completed');
      if (allComplete) {
        isComplete = true;
        console.log('\nAll sections completed!');
      } else {
        console.log('\nWaiting 10 seconds before next check...');
        await sleep(10000);
      }
    }

    if (!isComplete) {
      console.log('\nTimeout waiting for completion');
    }

  } catch (error) {
    console.error('Simulation failed:', error);
  }
}

// Run the simulation
simulateWorkflow();
