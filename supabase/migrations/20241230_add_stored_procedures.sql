-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$;

-- Function to create the generation queue table
CREATE OR REPLACE FUNCTION create_generation_queue_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create section type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_type') THEN
    CREATE TYPE section_type AS ENUM (
      'welcome',
      'industry_trends',
      'practical_tips',
      'success_stories'
    );
  END IF;

  -- Create generation status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generation_status') THEN
    CREATE TYPE generation_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'failed'
    );
  END IF;

  -- Create the table if it doesn't exist
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

  -- Create indexes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'newsletter_generation_queue_status_idx') THEN
    CREATE INDEX newsletter_generation_queue_status_idx ON newsletter_generation_queue(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'newsletter_generation_queue_newsletter_id_idx') THEN
    CREATE INDEX newsletter_generation_queue_newsletter_id_idx ON newsletter_generation_queue(newsletter_id);
  END IF;

  -- Create trigger if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at') THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON newsletter_generation_queue
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END;
$$;
