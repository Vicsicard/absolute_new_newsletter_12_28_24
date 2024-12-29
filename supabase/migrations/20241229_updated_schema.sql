-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS image_generation_history CASCADE;
DROP TABLE IF EXISTS newsletter_contacts CASCADE;
DROP TABLE IF EXISTS csv_uploads CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS newsletter_sections CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS industry_insights CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    target_audience TEXT,
    audience_description TEXT,
    contact_email TEXT NOT NULL,
    website_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry Insights table
CREATE TABLE industry_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    industry TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_industry_insights_company_id ON industry_insights(company_id);
CREATE INDEX idx_industry_insights_industry ON industry_insights(industry);

-- Newsletters table
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    subject TEXT NOT NULL,
    draft_status TEXT DEFAULT 'pending' CHECK (draft_status IN ('pending', 'sent', 'failed')),
    draft_recipient_email TEXT,
    draft_sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'draft_sent', 'pending_contacts', 'ready_to_send', 'sending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    last_sent_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_newsletters_draft_status ON newsletters(draft_status);
CREATE INDEX idx_newsletters_draft_recipient ON newsletters(draft_recipient_email);
CREATE INDEX idx_newsletters_company_id ON newsletters(company_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);

-- Newsletter Sections table
CREATE TABLE newsletter_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    section_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(newsletter_id, section_number)
);

CREATE INDEX idx_newsletter_sections_newsletter_id ON newsletter_sections(newsletter_id);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    email TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, email)
);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Newsletter Contacts table
CREATE TABLE newsletter_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(newsletter_id, contact_id)
);

CREATE INDEX idx_newsletter_contacts_contact_id ON newsletter_contacts(contact_id);
CREATE INDEX idx_newsletter_contacts_newsletter_id ON newsletter_contacts(newsletter_id);
CREATE INDEX idx_newsletter_contacts_status ON newsletter_contacts(status);

-- CSV Uploads table
CREATE TABLE csv_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processed_rows INTEGER DEFAULT 0,
    total_rows INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_csv_uploads_company_id ON csv_uploads(company_id);
CREATE INDEX idx_csv_uploads_status ON csv_uploads(status);

-- Image Generation History table
CREATE TABLE image_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_section_id UUID REFERENCES newsletter_sections(id),
    prompt TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_image_generation_newsletter_section ON image_generation_history(newsletter_section_id);
CREATE INDEX idx_image_generation_status ON image_generation_history(status);
