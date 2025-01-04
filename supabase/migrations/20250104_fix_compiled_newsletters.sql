-- Drop and recreate compiled_newsletters table
DROP TABLE IF EXISTS compiled_newsletters;

CREATE TABLE compiled_newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id),
    html_content TEXT NOT NULL,
    compiled_status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT compiled_newsletters_newsletter_id_key UNIQUE (newsletter_id),
    CONSTRAINT compiled_newsletters_status_check CHECK (compiled_status IN ('draft', 'ready', 'sent', 'error'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_compiled_newsletters_status ON compiled_newsletters(compiled_status);
CREATE INDEX IF NOT EXISTS idx_compiled_newsletters_newsletter_id ON compiled_newsletters(newsletter_id);
