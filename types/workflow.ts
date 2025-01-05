import { Database } from './database';

export type WorkflowStep = 'INITIALIZE' | 'WELCOME_SECTION' | 'TRENDS_SECTION' | 'TIPS_SECTION' | 'COMPILE' | 'SEND_DRAFT' | 'COMPLETE';

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface WorkflowStepConfig {
  name: string;
  next: WorkflowStep | null;
  section_number?: number;
  queueItems?: Array<{
    type: string;
    section_number: number;
  }>;
  validates?: (newsletterId: string) => Promise<boolean>;
}

export interface WorkflowState {
  id: string;
  newsletter_id: string;
  current_step: WorkflowStep;
  step_status: WorkflowStepStatus;
  step_data: Record<string, any> | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowHistoryEntry {
  id: string;
  workflow_id: string;
  step: WorkflowStep;
  status: WorkflowStepStatus;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export type NewsletterWithWorkflow = Database['public']['Tables']['newsletters']['Row'] & {
  workflow: WorkflowState;
}
