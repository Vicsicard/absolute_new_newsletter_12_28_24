-- Drop and recreate foreign key constraints
ALTER TABLE newsletters DROP CONSTRAINT IF EXISTS newsletters_company_id_fkey;
ALTER TABLE newsletters ADD CONSTRAINT newsletters_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE newsletter_sections DROP CONSTRAINT IF EXISTS newsletter_sections_newsletter_id_fkey;
ALTER TABLE newsletter_sections ADD CONSTRAINT newsletter_sections_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES newsletters(id);

ALTER TABLE newsletter_generation_queue DROP CONSTRAINT IF EXISTS newsletter_generation_queue_newsletter_id_fkey;
ALTER TABLE newsletter_generation_queue ADD CONSTRAINT newsletter_generation_queue_newsletter_id_fkey FOREIGN KEY (newsletter_id) REFERENCES newsletters(id);

-- Add unique constraint for newsletter sections
ALTER TABLE newsletter_sections DROP CONSTRAINT IF EXISTS newsletter_sections_newsletter_id_section_number_key;
ALTER TABLE newsletter_sections ADD CONSTRAINT newsletter_sections_newsletter_id_section_number_key UNIQUE (newsletter_id, section_number);

-- Add status constraints
ALTER TABLE newsletters DROP CONSTRAINT IF EXISTS newsletters_status_check;
ALTER TABLE newsletters ADD CONSTRAINT newsletters_status_check CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE newsletters DROP CONSTRAINT IF EXISTS newsletters_draft_status_check;
ALTER TABLE newsletters ADD CONSTRAINT newsletters_draft_status_check CHECK (draft_status IN ('draft', 'draft_sent', 'pending_contacts', 'ready_to_send', 'sending', 'sent', 'failed'));

ALTER TABLE newsletter_sections DROP CONSTRAINT IF EXISTS newsletter_sections_section_type_check;
ALTER TABLE newsletter_sections ADD CONSTRAINT newsletter_sections_section_type_check CHECK (section_type IN ('welcome', 'industry_trends', 'practical_tips'));

ALTER TABLE newsletter_sections DROP CONSTRAINT IF EXISTS newsletter_sections_status_check;
ALTER TABLE newsletter_sections ADD CONSTRAINT newsletter_sections_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Add queue status constraint
ALTER TABLE newsletter_generation_queue DROP CONSTRAINT IF EXISTS newsletter_generation_queue_status_check;
ALTER TABLE newsletter_generation_queue ADD CONSTRAINT newsletter_generation_queue_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));
