# Database Schema and Indexes

This document outlines the database schema, relationships, and indexes used in the newsletter application.

## Table Schemas

### Companies
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    target_audience TEXT,
    audience_description TEXT,
    contact_email TEXT NOT NULL,
    website_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Newsletters
```sql
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    subject TEXT NOT NULL,
    draft_status TEXT DEFAULT 'pending',
    draft_recipient_email TEXT,
    draft_sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    last_sent_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Newsletter Sections
```sql
CREATE TABLE newsletter_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    section_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(newsletter_id, section_number)
);
```

### Contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    email TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, email)
);
```

### Newsletter Contacts
```sql
CREATE TABLE newsletter_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(newsletter_id, contact_id)
);
```

### Image Generation History
```sql
CREATE TABLE image_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_section_id UUID REFERENCES newsletter_sections(id),
    prompt TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Industry Insights
```sql
CREATE TABLE industry_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    industry TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### CSV Uploads
```sql
CREATE TABLE csv_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    processed_rows INTEGER DEFAULT 0,
    total_rows INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Compiled Newsletters
```sql
CREATE TABLE compiled_newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID UNIQUE,
    html_content TEXT NOT NULL,
    email_subject TEXT NOT NULL,
    preview_text TEXT,
    compiled_status TEXT DEFAULT 'draft' NOT NULL,
    error_message TEXT,
    sent_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    public_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
```

## Foreign Key Relationships
```sql
-- Companies relationships
ALTER TABLE industry_insights ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE csv_uploads ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE newsletters ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE contacts ADD FOREIGN KEY (company_id) REFERENCES companies(id);

-- Newsletters relationships
ALTER TABLE newsletter_sections ADD FOREIGN KEY (newsletter_id) REFERENCES newsletters(id);
ALTER TABLE newsletter_contacts ADD FOREIGN KEY (newsletter_id) REFERENCES newsletters(id);

-- Contacts relationships
ALTER TABLE newsletter_contacts ADD FOREIGN KEY (contact_id) REFERENCES contacts(id);

-- Newsletter Sections relationships
ALTER TABLE image_generation_history ADD FOREIGN KEY (newsletter_section_id) REFERENCES newsletter_sections(id);
```

## Status Enums and Check Constraints

### Newsletter Status
```sql
CHECK (status = ANY(ARRAY[
    'draft',
    'draft_sent',
    'pending_contacts',
    'ready_to_send',
    'sending',
    'sent',
    'failed'
]::text[]))
```

### Image Generation Status
```sql
CHECK (status = ANY(ARRAY[
    'pending',
    'processing',
    'completed',
    'failed'
]::text[]))
```

### Compiled Newsletter Status
```sql
CHECK (compiled_status = ANY(ARRAY[
    'draft',
    'ready',
    'sent',
    'error'
]::text[]))
```

## Indexes

### Companies
- `companies_pkey`: Primary key on `id`

### Contacts
- `contacts_pkey`: Primary key on `id`
- `contacts_company_id_email_key`: Unique index on `(company_id, email)`
- `idx_contacts_company_id`: Index on `company_id`
- `idx_contacts_email`: Index on `email`

### Newsletters
- `newsletters_pkey`: Primary key on `id`
- `idx_newsletters_company_id`: Index on `company_id`
- `idx_newsletters_draft_recipient`: Index on `draft_recipient_email`
- `idx_newsletters_draft_status`: Index on `draft_status`

### Newsletter Sections
- `newsletter_sections_pkey`: Primary key on `id`
- `newsletter_sections_newsletter_id_section_number_key`: Unique index on `(newsletter_id, section_number)`
- `idx_newsletter_sections_newsletter_id`: Index on `newsletter_id`

### Newsletter Contacts
- `newsletter_contacts_pkey`: Primary key on `id`
- `newsletter_contacts_newsletter_id_contact_id_key`: Unique index on `(newsletter_id, contact_id)`
- `idx_newsletter_contacts_newsletter_id`: Index on `newsletter_id`
- `idx_newsletter_contacts_contact_id`: Index on `contact_id`
- `idx_newsletter_contacts_status`: Index on `status`

### Image Generation History
- `image_generation_history_pkey`: Primary key on `id`
- `idx_image_generation_newsletter_section`: Index on `newsletter_section_id`
- `idx_image_generation_status`: Index on `status`

### Industry Insights
- `industry_insights_pkey`: Primary key on `id`
- `idx_industry_insights_company_id`: Index on `company_id`
- `idx_industry_insights_industry`: Index on `industry`

### CSV Uploads
- `csv_uploads_pkey`: Primary key on `id`
- `idx_csv_uploads_company_id`: Index on `company_id`
- `idx_csv_uploads_status`: Index on `status`

### Compiled Newsletters
- `compiled_newsletters_pkey`: Primary key on `id`
- `compiled_newsletters_newsletter_id_key`: Unique index on `newsletter_id`
- `idx_compiled_newsletters_status`: Index on `compiled_status`
