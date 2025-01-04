-- Function to refresh schema cache
CREATE OR REPLACE FUNCTION schema_cache_refresh()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Function to add foreign key constraints
CREATE OR REPLACE FUNCTION add_foreign_key_constraints()
RETURNS void AS $$
BEGIN
  -- Add foreign key from newsletters to companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'newsletters_company_id_fkey'
  ) THEN
    ALTER TABLE newsletters
    ADD CONSTRAINT newsletters_company_id_fkey
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE;
  END IF;

  -- Add foreign key from newsletter_sections to newsletters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'newsletter_sections_newsletter_id_fkey'
  ) THEN
    ALTER TABLE newsletter_sections
    ADD CONSTRAINT newsletter_sections_newsletter_id_fkey
    FOREIGN KEY (newsletter_id)
    REFERENCES newsletters(id)
    ON DELETE CASCADE;
  END IF;

  -- Add foreign key from newsletter_generation_queue to newsletters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'newsletter_generation_queue_newsletter_id_fkey'
  ) THEN
    ALTER TABLE newsletter_generation_queue
    ADD CONSTRAINT newsletter_generation_queue_newsletter_id_fkey
    FOREIGN KEY (newsletter_id)
    REFERENCES newsletters(id)
    ON DELETE CASCADE;
  END IF;
END;
$$ LANGUAGE plpgsql;
