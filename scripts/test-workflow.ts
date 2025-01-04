import dotenv from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { initializeWorkflow } from '../utils/workflow';
import { getWorkflowMetrics, getStepMetrics } from '../utils/monitoring';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestNewsletter(companyId: string) {
  const { data: newsletter, error } = await supabase
    .from('newsletters')
    .insert({
      company_id: companyId,
      status: 'draft',
      draft_status: 'draft',
      title: `Test Newsletter ${new Date().toISOString()}`,
      description: 'Test newsletter for workflow validation'
    })
    .select()
    .single();

  if (error) throw error;
  return newsletter;
}

async function createTestCompany() {
  const { data: company, error } = await supabase
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

  if (error) throw error;
  return company;
}

async function simulateWorkflow() {
  console.log('Starting workflow simulation...\n');

  try {
    // Create test company and newsletter
    console.log('Creating test company...');
    const company = await createTestCompany();
    console.log('Company created:', company.company_name);

    console.log('\nCreating test newsletter...');
    const newsletter = await createTestNewsletter(company.id);
    console.log('Newsletter created:', newsletter.title);

    // Initialize workflow
    console.log('\nInitializing workflow...');
    const workflow = await initializeWorkflow(newsletter.id);
    console.log('Workflow initialized:', workflow.id);

    // Create queue items for testing
    console.log('\nCreating test queue items...');
    const sections = [
      { type: 'welcome', section_number: 1 },
      { type: 'industry_trends', section_number: 2 },
      { type: 'practical_tips', section_number: 3 }
    ];

    for (const section of sections) {
      const { error } = await supabase
        .from('newsletter_generation_queue')
        .insert({
          newsletter_id: newsletter.id,
          section_type: section.type,
          section_number: section.section_number,
          status: 'pending'
        });

      if (error) throw error;
      console.log(`Queue item created for ${section.type}`);
    }

    // Start the queue processor
    console.log('\nStarting queue processor...');
    console.log('Check the queue processor logs for processing details.');
    
    // Wait for processing to complete (in real scenario, this would be event-driven)
    console.log('\nWaiting for processing to complete...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    // Get workflow metrics
    console.log('\nFetching workflow metrics...');
    const metrics = await getWorkflowMetrics();
    console.log('Workflow Metrics:', JSON.stringify(metrics, null, 2));

    // Get step metrics
    console.log('\nFetching step metrics...');
    const stepMetrics = await getStepMetrics();
    console.log('Step Metrics:', JSON.stringify(stepMetrics, null, 2));

    // Check for any errors
    console.log('\nChecking for errors...');
    const { data: errors } = await supabase
      .from('workflow_errors')
      .select('*')
      .eq('newsletter_id', newsletter.id);

    if (errors && errors.length > 0) {
      console.log('Errors found:', errors);
    } else {
      console.log('No errors found');
    }

    // Check final workflow state
    const { data: finalWorkflow } = await supabase
      .from('newsletter_workflows')
      .select('*')
      .eq('id', workflow.id)
      .single();

    console.log('\nFinal workflow state:', finalWorkflow);

  } catch (error) {
    console.error('Simulation failed:', error);
  }
}

// Run the simulation
simulateWorkflow();
