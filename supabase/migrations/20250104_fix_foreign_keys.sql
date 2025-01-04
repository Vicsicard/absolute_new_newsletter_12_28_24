-- Create exec_sql function for migrations if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Fix foreign key constraints for newsletter_sections table
ALTER TABLE newsletter_sections
DROP CONSTRAINT IF EXISTS newsletter_sections_newsletter_id_fkey CASCADE,
ADD CONSTRAINT newsletter_sections_newsletter_id_fkey 
FOREIGN KEY (newsletter_id) REFERENCES newsletters(id);

-- Refresh foreign key relationships in PostgREST cache
NOTIFY pgrst, 'reload schema';
