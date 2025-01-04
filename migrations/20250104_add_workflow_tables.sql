-- Add newsletter workflows table
CREATE TABLE newsletter_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    current_step TEXT NOT NULL,
    step_status TEXT NOT NULL DEFAULT 'pending',
    step_data JSONB,
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_newsletter_workflow UNIQUE (newsletter_id)
);

-- Add indexes for performance
CREATE INDEX idx_newsletter_workflows_newsletter_id ON newsletter_workflows(newsletter_id);
CREATE INDEX idx_newsletter_workflows_current_step ON newsletter_workflows(current_step);
CREATE INDEX idx_newsletter_workflows_step_status ON newsletter_workflows(step_status);

-- Add workflow step validation constraints
ALTER TABLE newsletter_workflows
    ADD CONSTRAINT valid_step_status 
    CHECK (step_status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Add workflow step history for auditing
CREATE TABLE newsletter_workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES newsletter_workflows(id),
    step TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for workflow history
CREATE INDEX idx_workflow_history_workflow_id ON newsletter_workflow_history(workflow_id);
CREATE INDEX idx_workflow_history_step ON newsletter_workflow_history(step);
CREATE INDEX idx_workflow_history_created_at ON newsletter_workflow_history(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_workflows_updated_at
    BEFORE UPDATE ON newsletter_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to log workflow state changes
CREATE OR REPLACE FUNCTION log_workflow_state_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR 
       (TG_OP = 'UPDATE' AND 
        (OLD.current_step != NEW.current_step OR OLD.step_status != NEW.step_status)) THEN
        INSERT INTO newsletter_workflow_history
            (workflow_id, step, status, error_message, metadata)
        VALUES
            (NEW.id, NEW.current_step, NEW.step_status, NEW.error_message, NEW.step_data);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_newsletter_workflow_changes
    AFTER INSERT OR UPDATE ON newsletter_workflows
    FOR EACH ROW
    EXECUTE FUNCTION log_workflow_state_changes();
