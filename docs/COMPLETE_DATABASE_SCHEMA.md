# Complete Database Schema Documentation

This document serves as the single source of truth for the newsletter application's database schema, based on the complete schema migration from January 3, 2025.

## Table Structures

### Companies
```sql
CREATE TABLE companies (
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
```

### Contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Newsletters
```sql
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    draft_status TEXT DEFAULT 'draft',
    draft_recipient_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Newsletter Sections
```sql
CREATE TABLE newsletter_sections (
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
```

### Newsletter Contacts
```sql
CREATE TABLE newsletter_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Industry Insights
```sql
CREATE TABLE industry_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    industry TEXT NOT NULL,
    insight TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Compiled Newsletters
```sql
CREATE TABLE compiled_newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    html_content TEXT NOT NULL,
    compiled_status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Newsletter Generation Queue
```sql
CREATE TABLE newsletter_generation_queue (
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
```

## Constraints and Status Enums

### Newsletter Status Values
- `draft`
- `published`
- `archived`

### Newsletter Draft Status Values
- `draft`
- `draft_sent`
- `pending_contacts`
- `ready_to_send`
- `sending`
- `sent`
- `failed`

### Newsletter Section Types
- `welcome`
- `industry_trends`
- `practical_tips`

### Newsletter Section Status Values
- `pending`
- `in_progress`
- `completed`
- `failed`

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

### Newsletter Generation Queue
- `newsletter_generation_queue_pkey`: Primary key on `id`
- `newsletter_generation_queue_newsletter_id_section_type_key`: Unique index on `(newsletter_id, section_type)`
- `newsletter_generation_queue_status_idx`: Index on `status`
- `newsletter_generation_queue_newsletter_id_idx`: Index on `newsletter_id`

## Notes
- All tables include `created_at` and `updated_at` timestamps
- UUIDs are used for all primary keys
- Proper foreign key constraints are in place for all relationships
- Status fields have appropriate CHECK constraints
- Indexes are optimized for common query patterns
- All timestamps use TIMESTAMPTZ for proper timezone handling
