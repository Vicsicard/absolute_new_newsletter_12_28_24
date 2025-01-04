-- Refresh schema cache
SELECT schema_cache_refresh();

-- Add foreign key relationships
ALTER TABLE IF EXISTS newsletters
  ADD CONSTRAINT newsletters_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS newsletter_sections
  ADD CONSTRAINT newsletter_sections_newsletter_id_fkey
  FOREIGN KEY (newsletter_id)
  REFERENCES newsletters(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS newsletter_generation_queue
  ADD CONSTRAINT newsletter_generation_queue_newsletter_id_fkey
  FOREIGN KEY (newsletter_id)
  REFERENCES newsletters(id)
  ON DELETE CASCADE;
