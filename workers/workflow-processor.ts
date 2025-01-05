import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Verify required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BREVO_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Workflow step interface
interface WorkflowStepConfig {
  name: string;
  table: string;
  handler: (process: WorkflowProcess) => Promise<boolean>;
  next_steps: readonly string[];
  required_status: string;
  section_number?: number;
}

// Workflow step definitions
const WORKFLOW_STEPS = {
  NEWSLETTER_INIT: {
    name: 'newsletter_init',
    table: 'newsletters',
    handler: handleNewsletterInit,
    next_steps: ['QUEUE_GENERATION'] as const,
    required_status: 'draft'
  },
  QUEUE_GENERATION: {
    name: 'queue_generation',
    table: 'newsletter_generation_queue',
    handler: handleQueueGeneration,
    next_steps: ['SECTION_1_GEN'] as const,
    required_status: 'pending'
  },
  SECTION_1_GEN: {
    name: 'section_1_gen',
    table: 'newsletter_sections',
    handler: handleSectionGeneration,
    next_steps: ['SECTION_2_GEN'] as const,
    required_status: 'pending',
    section_number: 1
  },
  SECTION_2_GEN: {
    name: 'section_2_gen',
    table: 'newsletter_sections',
    handler: handleSectionGeneration,
    next_steps: ['SECTION_3_GEN'] as const,
    required_status: 'pending',
    section_number: 2
  },
  SECTION_3_GEN: {
    name: 'section_3_gen',
    table: 'newsletter_sections',
    handler: handleSectionGeneration,
    next_steps: ['NEWSLETTER_COMPILE'] as const,
    required_status: 'pending',
    section_number: 3
  },
  NEWSLETTER_COMPILE: {
    name: 'newsletter_compile',
    table: 'compiled_newsletters',
    handler: handleNewsletterCompile,
    next_steps: ['DRAFT_REVIEW'] as const,
    required_status: 'pending'
  },
  DRAFT_REVIEW: {
    name: 'draft_review',
    table: 'newsletters',
    handler: handleDraftReview,
    next_steps: ['AWAIT_APPROVAL'] as const,
    required_status: 'ready_to_send'
  },
  AWAIT_APPROVAL: {
    name: 'await_approval',
    table: 'newsletters',
    handler: handleAwaitApproval,
    next_steps: ['FINAL_SEND'] as const,
    required_status: 'draft_sent'
  },
  FINAL_SEND: {
    name: 'final_send',
    table: 'newsletters',
    handler: handleFinalSend,
    next_steps: [] as const,
    required_status: 'pending_contacts'
  }
} as const satisfies Record<string, WorkflowStepConfig>;

type WorkflowStep = keyof typeof WORKFLOW_STEPS;

interface WorkflowProcess {
  id: string;
  newsletter_id: string;
  current_step: WorkflowStep;
  step_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

// Handler functions for each step
async function handleNewsletterInit(process: WorkflowProcess) {
  // Initialize newsletter sections
  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', process.newsletter_id)
    .single();

  if (!newsletter) {
    throw new Error('Newsletter not found');
  }

  // Create initial sections
  const sections = [
    { type: 'welcome', number: 1 },
    { type: 'industry_trends', number: 2 },
    { type: 'practical_tips', number: 3 }
  ];

  for (const section of sections) {
    await supabase
      .from('newsletter_sections')
      .upsert({
        newsletter_id: process.newsletter_id,
        section_type: section.type,
        section_number: section.number,
        status: 'pending'
      });
  }

  return true;
}

async function handleQueueGeneration(process: WorkflowProcess) {
  const { data: sections } = await supabase
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', process.newsletter_id);

  if (!sections) {
    throw new Error('No sections found');
  }

  // Create queue items for each section
  for (const section of sections) {
    await supabase
      .from('newsletter_generation_queue')
      .upsert({
        newsletter_id: process.newsletter_id,
        section_type: section.section_type,
        section_number: section.section_number,
        status: 'pending'
      });
  }

  return true;
}

async function handleSectionGeneration(process: WorkflowProcess) {
  const step = WORKFLOW_STEPS[process.current_step as WorkflowStep];
  
  // Type guard for section generation steps
  if (!('section_number' in step)) {
    throw new Error('Step requires section_number but none was provided');
  }
  
  // Get the queue item for this section
  const { data: queueItem } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('newsletter_id', process.newsletter_id)
    .eq('section_number', step.section_number)
    .single();

  if (!queueItem) {
    throw new Error('Queue item not found');
  }

  // Process the section using OpenAI
  // ... (existing OpenAI processing logic)

  return true;
}

async function handleNewsletterCompile(process: WorkflowProcess) {
  // Get all completed sections
  const { data: sections } = await supabase
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', process.newsletter_id)
    .eq('status', 'completed')
    .order('section_number');

  if (!sections || sections.length !== 3) {
    throw new Error('Not all sections are completed');
  }

  // Compile HTML
  const html = sections.map(section => `
    <h2>${section.title}</h2>
    <div>${section.content}</div>
  `).join('\n');

  // Create compiled newsletter
  await supabase
    .from('compiled_newsletters')
    .upsert({
      newsletter_id: process.newsletter_id,
      html_content: html,
      compiled_status: 'completed'
    });

  // Update newsletter status
  await supabase
    .from('newsletters')
    .update({ draft_status: 'ready_to_send' })
    .eq('id', process.newsletter_id);

  return true;
}

async function handleDraftReview(process: WorkflowProcess) {
  // Send draft email logic here
  // ... (implement draft email sending)
  
  // Update newsletter status
  await supabase
    .from('newsletters')
    .update({ draft_status: 'draft_sent' })
    .eq('id', process.newsletter_id);

  return true;
}

async function handleAwaitApproval(process: WorkflowProcess) {
  // Check if newsletter has been approved
  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('draft_status')
    .eq('id', process.newsletter_id)
    .single();

  if (newsletter?.draft_status === 'pending_contacts') {
    return true;
  }

  return false; // Still waiting for approval
}

async function handleFinalSend(process: WorkflowProcess) {
  // Send to all contacts logic here
  // ... (implement final email sending)
  
  // Update newsletter status
  await supabase
    .from('newsletters')
    .update({ 
      status: 'published',
      draft_status: 'sent'
    })
    .eq('id', process.newsletter_id);

  return true;
}

// Main workflow processor
async function processWorkflow() {
  while (true) {
    try {
      // Get active processes
      const { data: processes } = await supabase
        .from('workflow_processes')
        .select('*')
        .in('step_status', ['pending', 'in_progress'])
        .order('created_at');

      if (!processes || processes.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      for (const process of processes) {
        try {
          // Get current step configuration
          const step = WORKFLOW_STEPS[process.current_step as WorkflowStep];

          // Update process to in_progress
          await supabase
            .from('workflow_processes')
            .update({ 
              step_status: 'in_progress',
              started_at: new Date().toISOString()
            })
            .eq('id', process.id);

          // Log step start
          await supabase
            .from('workflow_step_logs')
            .insert({
              process_id: process.id,
              step_name: step.name,
              status: 'in_progress'
            });

          // Execute step handler
          const success = await step.handler(process);

          if (success) {
            // Step completed successfully
            const updates: any = {
              step_status: 'completed',
              completed_at: new Date().toISOString()
            };

            // If there are next steps, create new process
            if (step.next_steps.length > 0) {
              const nextStep = step.next_steps[0];
              await supabase
                .from('workflow_processes')
                .insert({
                  newsletter_id: process.newsletter_id,
                  current_step: nextStep,
                  step_status: 'pending'
                });
            }

            // Update current process
            await supabase
              .from('workflow_processes')
              .update(updates)
              .eq('id', process.id);

            // Log step completion
            await supabase
              .from('workflow_step_logs')
              .insert({
                process_id: process.id,
                step_name: step.name,
                status: 'completed',
                completed_at: new Date().toISOString()
              });
          }
        } catch (error: any) {
          console.error(`Error processing step ${process.current_step}:`, error);

          // Update process status
          await supabase
            .from('workflow_processes')
            .update({ 
              step_status: 'failed',
              error_message: error.message
            })
            .eq('id', process.id);

          // Log step failure
          await supabase
            .from('workflow_step_logs')
            .insert({
              process_id: process.id,
              step_name: WORKFLOW_STEPS[process.current_step as WorkflowStep].name,
              status: 'failed',
              error_message: error.message
            });
        }
      }
    } catch (error) {
      console.error('Error in workflow processor:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start the workflow processor
console.log('Starting workflow processor...');
processWorkflow().catch(error => {
  console.error('Fatal error in workflow processor:', error);
  process.exit(1);
});
