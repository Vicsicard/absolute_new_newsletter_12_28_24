-- Create an enum for section types
CREATE TYPE section_type AS ENUM (
  'welcome',
  'industry_trends',
  'practical_tips'
);

-- Create an enum for generation status
CREATE TYPE generation_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- Create newsletter generation queue table
CREATE TABLE IF NOT EXISTS newsletter_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  section_number INTEGER NOT NULL,
  status generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure each newsletter only has one queue item per section type
  UNIQUE(newsletter_id, section_type)
);

-- Create index for faster lookups
CREATE INDEX newsletter_generation_queue_status_idx ON newsletter_generation_queue(status);
CREATE INDEX newsletter_generation_queue_newsletter_id_idx ON newsletter_generation_queue(newsletter_id);

-- Add trigger to update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON newsletter_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
