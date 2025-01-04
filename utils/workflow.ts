import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { WorkflowStep, WorkflowStepConfig, WorkflowState, WorkflowStepStatus } from '../types/workflow';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const WORKFLOW_STEPS: Record<WorkflowStep, WorkflowStepConfig> = {
  INIT: {
    name: 'initialize',
    next: 'WELCOME_SECTION',
    validates: async (newsletterId) => {
      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('status, draft_status')
        .eq('id', newsletterId)
        .single();

      return newsletter?.status === 'draft' && newsletter?.draft_status === 'draft';
    }
  },
  WELCOME_SECTION: {
    name: 'welcome_section',
    next: 'TRENDS_SECTION',
    validates: async (newsletterId) => {
      const { data: workflow } = await supabase
        .from('newsletter_workflows')
        .select('current_step, step_status')
        .eq('newsletter_id', newsletterId)
        .single();

      return workflow?.current_step === 'WELCOME_SECTION';
    },
    queueItems: [
      { type: 'welcome', section_number: 1 }
    ]
  },
  TRENDS_SECTION: {
    name: 'trends_section',
    next: 'TIPS_SECTION',
    validates: async (newsletterId) => {
      const { data: sections } = await supabase
        .from('newsletter_sections')
        .select('status')
        .eq('newsletter_id', newsletterId)
        .eq('section_type', 'welcome');

      return sections?.[0]?.status === 'completed';
    },
    queueItems: [
      { type: 'industry_trends', section_number: 2 }
    ]
  },
  TIPS_SECTION: {
    name: 'tips_section',
    next: 'COMPILE',
    validates: async (newsletterId) => {
      const { data: sections } = await supabase
        .from('newsletter_sections')
        .select('status')
        .eq('newsletter_id', newsletterId)
        .eq('section_type', 'industry_trends');

      return sections?.[0]?.status === 'completed';
    },
    queueItems: [
      { type: 'practical_tips', section_number: 3 }
    ]
  },
  COMPILE: {
    name: 'compile',
    next: 'SEND_DRAFT',
    validates: async (newsletterId) => {
      const { data: sections } = await supabase
        .from('newsletter_sections')
        .select('status')
        .eq('newsletter_id', newsletterId);

      return sections?.every(s => s.status === 'completed') ?? false;
    }
  },
  SEND_DRAFT: {
    name: 'send_draft',
    next: 'COMPLETE',
    validates: async (newsletterId) => {
      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('draft_status')
        .eq('id', newsletterId)
        .single();

      return newsletter?.draft_status === 'ready_to_send';
    }
  },
  COMPLETE: {
    name: 'complete',
    next: null,
    validates: async (newsletterId) => {
      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('draft_status')
        .eq('id', newsletterId)
        .single();

      return newsletter?.draft_status === 'draft_sent';
    }
  }
};

export async function initializeWorkflow(newsletterId: string): Promise<WorkflowState> {
  const { data: existing } = await supabase
    .from('newsletter_workflows')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .single();

  if (existing) {
    throw new Error('Workflow already exists for this newsletter');
  }

  const { data: workflow, error } = await supabase
    .from('newsletter_workflows')
    .insert({
      newsletter_id: newsletterId,
      current_step: 'INIT',
      step_status: 'pending'
    })
    .select()
    .single();

  if (error || !workflow) {
    throw new Error('Failed to initialize workflow');
  }

  return workflow;
}

export async function updateWorkflowStatus(
  workflowId: string,
  status: WorkflowStepStatus,
  error?: Error
): Promise<WorkflowState> {
  const updates: Partial<WorkflowState> = {
    step_status: status,
    updated_at: new Date().toISOString()
  };

  if (error) {
    updates.error_message = error.message;
    updates.attempts = supabase.rpc('increment_attempts', { workflow_id: workflowId });
  }

  const { data: workflow, error: updateError } = await supabase
    .from('newsletter_workflows')
    .update(updates)
    .eq('id', workflowId)
    .select()
    .single();

  if (updateError || !workflow) {
    throw new Error('Failed to update workflow status');
  }

  return workflow;
}

export async function advanceWorkflow(workflowId: string): Promise<WorkflowState> {
  // Get current workflow state
  const { data: workflow } = await supabase
    .from('newsletter_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const currentStep = WORKFLOW_STEPS[workflow.current_step];
  if (!currentStep.next) {
    // Workflow is complete
    return workflow;
  }

  // Update to next step
  const { data: updated, error } = await supabase
    .from('newsletter_workflows')
    .update({
      current_step: currentStep.next,
      step_status: 'pending',
      attempts: 0,
      error_message: null,
      step_data: null
    })
    .eq('id', workflowId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error('Failed to advance workflow');
  }

  // If next step has queue items, create them
  const nextStep = WORKFLOW_STEPS[currentStep.next];
  if (nextStep.queueItems) {
    for (const item of nextStep.queueItems) {
      await supabase
        .from('newsletter_generation_queue')
        .insert({
          newsletter_id: workflow.newsletter_id,
          section_type: item.type,
          section_number: item.section_number,
          status: 'pending'
        });
    }
  }

  return updated;
}

export async function isStepComplete(workflow: WorkflowState): Promise<boolean> {
  const step = WORKFLOW_STEPS[workflow.current_step];
  
  if (workflow.step_status !== 'completed') {
    return false;
  }

  // For steps with queue items, check if all items are complete
  if (step.queueItems) {
    const { data: queueItems } = await supabase
      .from('newsletter_generation_queue')
      .select('status')
      .eq('newsletter_id', workflow.newsletter_id)
      .in('section_type', step.queueItems.map(i => i.type));

    return queueItems?.every(item => item.status === 'completed') ?? false;
  }

  // For other steps, trust the workflow status
  return true;
}
