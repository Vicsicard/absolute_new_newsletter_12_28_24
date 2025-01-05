-- Create newsletter_workflows table
CREATE TABLE IF NOT EXISTS newsletter_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    current_step TEXT NOT NULL,
    step_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_workflows_newsletter_id_key ON newsletter_workflows(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_workflows_status ON newsletter_workflows(step_status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_newsletter_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_newsletter_workflows_updated_at
    BEFORE UPDATE ON newsletter_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_workflows_updated_at();

-- Add status enum check constraint
ALTER TABLE newsletter_workflows
ADD CONSTRAINT newsletter_workflows_step_status_check
CHECK (step_status IN ('pending', 'in_progress', 'completed', 'failed'));
