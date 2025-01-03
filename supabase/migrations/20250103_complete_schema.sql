-- Complete schema migration to match DATABASE_INDEXES.md exactly

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    target_audience TEXT,
    audience_description TEXT,
    website_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    draft_status TEXT DEFAULT 'draft',
    draft_recipient_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    section_number INTEGER NOT NULL,
    section_type TEXT NOT NULL DEFAULT 'welcome',
    title TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_section_id UUID REFERENCES newsletter_sections(id),
    prompt TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS industry_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    industry TEXT NOT NULL,
    insight TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csv_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compiled_newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    html_content TEXT NOT NULL,
    compiled_status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    section_type TEXT NOT NULL,
    section_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table primary key
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_pkey CASCADE,
ADD CONSTRAINT companies_pkey PRIMARY KEY (id);

-- Contacts table primary key and indexes
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_pkey CASCADE,
DROP CONSTRAINT IF EXISTS contacts_company_id_email_key CASCADE,
ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_contacts_company_id;
DROP INDEX IF EXISTS idx_contacts_email;
CREATE UNIQUE INDEX contacts_company_id_email_key ON contacts(company_id, email);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Newsletters table
ALTER TABLE newsletters 
DROP CONSTRAINT IF EXISTS newsletters_pkey CASCADE,
DROP CONSTRAINT IF EXISTS newsletters_draft_status_check CASCADE,
DROP CONSTRAINT IF EXISTS newsletters_status_check CASCADE,
ADD CONSTRAINT newsletters_pkey PRIMARY KEY (id),
ALTER COLUMN draft_status SET DEFAULT 'draft',
ADD CONSTRAINT newsletters_draft_status_check 
CHECK (draft_status IN ('draft', 'draft_sent', 'pending_contacts', 'ready_to_send', 'sending', 'sent', 'failed')),
ADD CONSTRAINT newsletters_status_check 
CHECK (status IN ('draft', 'published', 'archived'));

DROP INDEX IF EXISTS idx_newsletters_company_id;
DROP INDEX IF EXISTS idx_newsletters_draft_recipient;
DROP INDEX IF EXISTS idx_newsletters_draft_status;
CREATE INDEX idx_newsletters_company_id ON newsletters(company_id);
CREATE INDEX idx_newsletters_draft_recipient ON newsletters(draft_recipient_email);
CREATE INDEX idx_newsletters_draft_status ON newsletters(draft_status);

-- Newsletter Sections table
ALTER TABLE newsletter_sections
DROP CONSTRAINT IF EXISTS newsletter_sections_pkey CASCADE,
DROP CONSTRAINT IF EXISTS newsletter_sections_status_check CASCADE,
DROP CONSTRAINT IF EXISTS newsletter_sections_newsletter_id_section_number_key CASCADE,
ADD CONSTRAINT newsletter_sections_pkey PRIMARY KEY (id),
ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'welcome'
CHECK (section_type IN ('welcome', 'industry_trends', 'practical_tips')),
ALTER COLUMN status SET DEFAULT 'pending',
ADD CONSTRAINT newsletter_sections_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN content DROP NOT NULL;

DROP INDEX IF EXISTS idx_newsletter_sections_newsletter_id;
CREATE UNIQUE INDEX newsletter_sections_newsletter_id_section_number_key ON newsletter_sections(newsletter_id, section_number);
CREATE INDEX idx_newsletter_sections_newsletter_id ON newsletter_sections(newsletter_id);

-- Newsletter Contacts table
ALTER TABLE newsletter_contacts
DROP CONSTRAINT IF EXISTS newsletter_contacts_pkey CASCADE,
DROP CONSTRAINT IF EXISTS newsletter_contacts_newsletter_id_contact_id_key CASCADE,
ADD CONSTRAINT newsletter_contacts_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_newsletter_contacts_newsletter_id;
DROP INDEX IF EXISTS idx_newsletter_contacts_contact_id;
DROP INDEX IF EXISTS idx_newsletter_contacts_status;
CREATE UNIQUE INDEX newsletter_contacts_newsletter_id_contact_id_key ON newsletter_contacts(newsletter_id, contact_id);
CREATE INDEX idx_newsletter_contacts_newsletter_id ON newsletter_contacts(newsletter_id);
CREATE INDEX idx_newsletter_contacts_contact_id ON newsletter_contacts(contact_id);
CREATE INDEX idx_newsletter_contacts_status ON newsletter_contacts(status);

-- Image Generation History table
ALTER TABLE image_generation_history
DROP CONSTRAINT IF EXISTS image_generation_history_pkey CASCADE,
ADD CONSTRAINT image_generation_history_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_image_generation_newsletter_section;
DROP INDEX IF EXISTS idx_image_generation_status;
CREATE INDEX idx_image_generation_newsletter_section ON image_generation_history(newsletter_section_id);
CREATE INDEX idx_image_generation_status ON image_generation_history(status);

-- Industry Insights table
ALTER TABLE industry_insights
DROP CONSTRAINT IF EXISTS industry_insights_pkey CASCADE,
ADD CONSTRAINT industry_insights_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_industry_insights_company_id;
DROP INDEX IF EXISTS idx_industry_insights_industry;
CREATE INDEX idx_industry_insights_company_id ON industry_insights(company_id);
CREATE INDEX idx_industry_insights_industry ON industry_insights(industry);

-- CSV Uploads table
ALTER TABLE csv_uploads
DROP CONSTRAINT IF EXISTS csv_uploads_pkey CASCADE,
ADD CONSTRAINT csv_uploads_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_csv_uploads_company_id;
DROP INDEX IF EXISTS idx_csv_uploads_status;
CREATE INDEX idx_csv_uploads_company_id ON csv_uploads(company_id);
CREATE INDEX idx_csv_uploads_status ON csv_uploads(status);

-- Compiled Newsletters table
ALTER TABLE compiled_newsletters
DROP CONSTRAINT IF EXISTS compiled_newsletters_pkey CASCADE,
DROP CONSTRAINT IF EXISTS compiled_newsletters_status_check CASCADE,
DROP CONSTRAINT IF EXISTS compiled_newsletters_newsletter_id_key CASCADE,
ADD CONSTRAINT compiled_newsletters_pkey PRIMARY KEY (id),
ADD CONSTRAINT compiled_newsletters_status_check
CHECK (compiled_status = ANY(ARRAY['draft', 'ready', 'sent', 'error']::text[]));

DROP INDEX IF EXISTS idx_compiled_newsletters_status;
CREATE UNIQUE INDEX compiled_newsletters_newsletter_id_key ON compiled_newsletters(newsletter_id);
CREATE INDEX idx_compiled_newsletters_status ON compiled_newsletters(compiled_status);

-- Newsletter Generation Queue table
DROP TABLE IF EXISTS newsletter_generation_queue CASCADE;
CREATE TABLE newsletter_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    section_type TEXT NOT NULL,
    section_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX newsletter_generation_queue_newsletter_id_section_type_key ON newsletter_generation_queue(newsletter_id, section_type);
CREATE INDEX newsletter_generation_queue_status_idx ON newsletter_generation_queue(status);
CREATE INDEX newsletter_generation_queue_newsletter_id_idx ON newsletter_generation_queue(newsletter_id);

-- Update trigger function to match schema
CREATE OR REPLACE FUNCTION create_initial_queue_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create queue items for each section type
  INSERT INTO newsletter_generation_queue (
    newsletter_id,
    section_type,
    section_number,
    status,
    attempts,
    created_at,
    updated_at
  ) VALUES 
  (NEW.id, 'welcome', 1, 'pending', 0, NOW(), NOW()),
  (NEW.id, 'industry_trends', 2, 'pending', 0, NOW(), NOW()),
  (NEW.id, 'practical_tips', 3, 'pending', 0, NOW(), NOW());
  
  -- Create initial newsletter sections
  INSERT INTO newsletter_sections (
    newsletter_id,
    section_number,
    section_type,
    status,
    created_at,
    updated_at
  ) VALUES 
  (NEW.id, 1, 'welcome', 'pending', NOW(), NOW()),
  (NEW.id, 2, 'industry_trends', 'pending', NOW(), NOW()),
  (NEW.id, 3, 'practical_tips', 'pending', NOW(), NOW());
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS tr_create_newsletter_queue_items ON newsletters;
CREATE TRIGGER tr_create_newsletter_queue_items
  AFTER INSERT ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_queue_items();
