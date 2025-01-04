import { getSupabaseAdmin } from './supabase-admin';

interface ErrorLog {
  endpoint: string;
  method: string;
  error_message: string;
  error_code?: string;
  stack_trace?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

// Workflow monitoring interfaces
interface WorkflowMonitoringEvent {
  workflow_id: string;
  newsletter_id: string;
  event_type: 'step_start' | 'step_complete' | 'step_failed' | 'workflow_complete' | 'workflow_failed';
  step: string;
  duration_ms?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

interface WorkflowMetrics {
  total_workflows: number;
  active_workflows: number;
  failed_workflows: number;
  completed_workflows: number;
  average_step_duration_ms: number;
  error_rate: number;
}

interface StepMetrics {
  step: string;
  total_attempts: number;
  success_count: number;
  failure_count: number;
  average_duration_ms: number;
  error_rate: number;
}

export async function logApiError(error: any, req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const errorLog: ErrorLog = {
      endpoint: new URL(req.url).pathname,
      method: req.method,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_code: error.code || error.statusCode?.toString(),
      stack_trace: error.stack,
      metadata: {
        headers: Object.fromEntries(req.headers),
        timestamp: new Date().toISOString()
      }
    };

    // Log to database if available
    await supabaseAdmin
      .from('api_error_logs')
      .insert([errorLog])
      .select();

    // Also log to console for development
    console.error('API Error:', {
      ...errorLog,
      stack_trace: undefined // Don't log stack trace to console
    });
  } catch (loggingError) {
    // Fallback to console if logging fails
    console.error('Failed to log API error:', loggingError);
    console.error('Original error:', error);
  }
}

// Workflow monitoring functions
export async function logWorkflowEvent(event: WorkflowMonitoringEvent) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Log to workflow_monitoring table
    await supabaseAdmin
      .from('workflow_monitoring')
      .insert([{
        ...event,
        created_at: new Date().toISOString()
      }]);

    // Log significant events to console
    if (['step_failed', 'workflow_failed'].includes(event.event_type)) {
      console.error(`Workflow Error [${event.workflow_id}]:`, {
        step: event.step,
        error: event.error_message,
        metadata: event.metadata
      });
    }

    // Update metrics
    await updateWorkflowMetrics(event);
  } catch (error) {
    console.error('Failed to log workflow event:', error);
  }
}

export async function updateWorkflowMetrics(event: WorkflowMonitoringEvent) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Update step-specific metrics
    await supabaseAdmin.rpc('update_step_metrics', {
      p_step: event.step,
      p_duration: event.duration_ms || 0,
      p_success: event.event_type === 'step_complete',
      p_error: event.event_type === 'step_failed'
    });

    // Update overall workflow metrics
    if (['workflow_complete', 'workflow_failed'].includes(event.event_type)) {
      await supabaseAdmin.rpc('update_workflow_metrics', {
        p_success: event.event_type === 'workflow_complete'
      });
    }
  } catch (error) {
    console.error('Failed to update workflow metrics:', error);
  }
}

export async function getWorkflowMetrics(
  start_date?: string,
  end_date?: string
): Promise<WorkflowMetrics> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const { data } = await supabaseAdmin
      .rpc('get_workflow_metrics', { 
        p_start_date: start_date, 
        p_end_date: end_date 
      });

    return data;
  } catch (error) {
    console.error('Failed to get workflow metrics:', error);
    throw error;
  }
}

export async function getStepMetrics(
  step?: string,
  start_date?: string,
  end_date?: string
): Promise<StepMetrics[]> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const { data } = await supabaseAdmin
      .rpc('get_step_metrics', {
        p_step: step,
        p_start_date: start_date,
        p_end_date: end_date
      });

    return data;
  } catch (error) {
    console.error('Failed to get step metrics:', error);
    throw error;
  }
}

export async function detectAnomalies() {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Check for stuck workflows
    const { data: stuckWorkflows } = await supabaseAdmin
      .from('newsletter_workflows')
      .select('*')
      .eq('step_status', 'in_progress')
      .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 minutes

    if (stuckWorkflows?.length) {
      console.error(`Found ${stuckWorkflows.length} stuck workflows`);
      // Could add notification logic here
    }

    // Check for high error rates
    const metrics = await getWorkflowMetrics();
    if (metrics.error_rate > 0.1) { // 10% error rate threshold
      console.error(`High workflow error rate detected: ${metrics.error_rate * 100}%`);
      // Could add notification logic here
    }

    // Check for performance degradation
    const { data: slowSteps } = await supabaseAdmin
      .from('workflow_monitoring')
      .select('step, duration_ms')
      .gt('duration_ms', 60000) // 1 minute
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (slowSteps?.length) {
      console.warn(`Found ${slowSteps.length} slow workflow steps`);
      // Could add notification logic here
    }
  } catch (error) {
    console.error('Failed to detect anomalies:', error);
  }
}

// Enhanced error logging for workflows
export async function logWorkflowError(
  error: Error,
  context: {
    workflow_id: string;
    newsletter_id: string;
    step: string;
    metadata?: Record<string, any>;
  }
) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Log to workflow_errors table
    await supabaseAdmin
      .from('workflow_errors')
      .insert([{
        workflow_id: context.workflow_id,
        newsletter_id: context.newsletter_id,
        step: context.step,
        error_message: error.message,
        error_type: error.name,
        stack_trace: error.stack,
        metadata: {
          ...context.metadata,
          timestamp: new Date().toISOString()
        }
      }]);

    // Log workflow event
    await logWorkflowEvent({
      workflow_id: context.workflow_id,
      newsletter_id: context.newsletter_id,
      event_type: 'step_failed',
      step: context.step,
      error_message: error.message,
      metadata: context.metadata
    });

    // Console logging for development
    console.error('Workflow Error:', {
      workflow_id: context.workflow_id,
      step: context.step,
      error: error.message,
      metadata: context.metadata
    });
  } catch (loggingError) {
    console.error('Failed to log workflow error:', loggingError);
    console.error('Original error:', error);
  }
}
