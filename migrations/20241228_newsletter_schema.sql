-- Create tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    target_audience TEXT,
    audience_description TEXT,
    contact_email TEXT NOT NULL,
    website_url TEXT,
    phone_number TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'draft',
    draft_recipient_email TEXT,
    draft_sent_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS newsletter_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id),
    section_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    UNIQUE(newsletter_id, section_number)
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    email TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    UNIQUE(company_id, email)
);

CREATE TABLE IF NOT EXISTS newsletter_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    UNIQUE(newsletter_id, contact_id)
);

CREATE TABLE IF NOT EXISTS csv_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS image_generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_section_id UUID NOT NULL REFERENCES newsletter_sections(id),
    prompt TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_draft_recipient ON newsletters(draft_recipient_email);
CREATE INDEX IF NOT EXISTS newsletter_contacts_contact_id_idx ON newsletter_contacts(contact_id);
CREATE INDEX IF NOT EXISTS newsletter_contacts_newsletter_id_idx ON newsletter_contacts(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_image_generation_newsletter_section ON image_generation_history(newsletter_section_id);
