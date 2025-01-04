-- Create monitoring tables
CREATE TABLE IF NOT EXISTS workflow_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES newsletter_workflows(id),
    newsletter_id UUID REFERENCES newsletters(id),
    event_type TEXT NOT NULL,
    step TEXT NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES newsletter_workflows(id),
    newsletter_id UUID REFERENCES newsletters(id),
    step TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_type TEXT NOT NULL,
    stack_trace TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step TEXT,
    total_attempts INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_workflow_monitoring_workflow_id ON workflow_monitoring(workflow_id);
CREATE INDEX idx_workflow_monitoring_newsletter_id ON workflow_monitoring(newsletter_id);
CREATE INDEX idx_workflow_monitoring_event_type ON workflow_monitoring(event_type);
CREATE INDEX idx_workflow_monitoring_step ON workflow_monitoring(step);
CREATE INDEX idx_workflow_monitoring_created_at ON workflow_monitoring(created_at);

CREATE INDEX idx_workflow_errors_workflow_id ON workflow_errors(workflow_id);
CREATE INDEX idx_workflow_errors_newsletter_id ON workflow_errors(newsletter_id);
CREATE INDEX idx_workflow_errors_step ON workflow_errors(step);
CREATE INDEX idx_workflow_errors_created_at ON workflow_errors(created_at);

CREATE INDEX idx_workflow_metrics_step ON workflow_metrics(step);

-- Create function to update step metrics
CREATE OR REPLACE FUNCTION update_step_metrics(
    p_step TEXT,
    p_duration INTEGER,
    p_success BOOLEAN,
    p_error BOOLEAN
) RETURNS void AS $$
BEGIN
    INSERT INTO workflow_metrics (step, total_attempts, success_count, failure_count, total_duration_ms)
    VALUES (
        p_step,
        1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_error THEN 1 ELSE 0 END,
        p_duration
    )
    ON CONFLICT (step)
    DO UPDATE SET
        total_attempts = workflow_metrics.total_attempts + 1,
        success_count = workflow_metrics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        failure_count = workflow_metrics.failure_count + CASE WHEN p_error THEN 1 ELSE 0 END,
        total_duration_ms = workflow_metrics.total_duration_ms + p_duration,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get workflow metrics
CREATE OR REPLACE FUNCTION get_workflow_metrics(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
    total_workflows BIGINT,
    active_workflows BIGINT,
    failed_workflows BIGINT,
    completed_workflows BIGINT,
    average_step_duration_ms NUMERIC,
    error_rate NUMERIC
) AS $$
DECLARE
    v_start_date TIMESTAMPTZ := COALESCE(p_start_date, NOW() - INTERVAL '24 hours');
    v_end_date TIMESTAMPTZ := COALESCE(p_end_date, NOW());
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT
            COUNT(DISTINCT workflow_id) as total,
            COUNT(DISTINCT CASE WHEN event_type = 'workflow_failed' THEN workflow_id END) as failed,
            COUNT(DISTINCT CASE WHEN event_type = 'workflow_complete' THEN workflow_id END) as completed,
            COUNT(DISTINCT CASE WHEN event_type IN ('step_start', 'step_failed') AND 
                event_type NOT IN ('workflow_complete', 'workflow_failed') THEN workflow_id END) as active,
            AVG(CASE WHEN duration_ms IS NOT NULL THEN duration_ms::NUMERIC END) as avg_duration
        FROM workflow_monitoring
        WHERE created_at BETWEEN v_start_date AND v_end_date
    )
    SELECT
        total as total_workflows,
        active as active_workflows,
        failed as failed_workflows,
        completed as completed_workflows,
        avg_duration as average_step_duration_ms,
        CASE WHEN total > 0 THEN failed::NUMERIC / total ELSE 0 END as error_rate
    FROM metrics;
END;
$$ LANGUAGE plpgsql;

-- Create function to get step metrics
CREATE OR REPLACE FUNCTION get_step_metrics(
    p_step TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
    step TEXT,
    total_attempts BIGINT,
    success_count BIGINT,
    failure_count BIGINT,
    average_duration_ms NUMERIC,
    error_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.step,
        m.total_attempts,
        m.success_count,
        m.failure_count,
        CASE WHEN m.total_attempts > 0 
            THEN (m.total_duration_ms::NUMERIC / m.total_attempts)
            ELSE 0 
        END as average_duration_ms,
        CASE WHEN m.total_attempts > 0 
            THEN (m.failure_count::NUMERIC / m.total_attempts)
            ELSE 0 
        END as error_rate
    FROM workflow_metrics m
    WHERE (p_step IS NULL OR m.step = p_step)
    AND (
        p_start_date IS NULL OR
        p_end_date IS NULL OR
        m.updated_at BETWEEN p_start_date AND p_end_date
    )
    ORDER BY m.step;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data(
    p_days_to_keep INTEGER DEFAULT 30
) RETURNS void AS $$
BEGIN
    -- Delete old monitoring events
    DELETE FROM workflow_monitoring
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

    -- Delete old error logs
    DELETE FROM workflow_errors
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

    -- Archive metrics data older than the retention period
    -- You might want to implement a more sophisticated archiving strategy
END;
$$ LANGUAGE plpgsql;
