vercel deploy --prod]::text[]))
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

### Newsletter Generation Queue
- `newsletter_generation_queue_pkey`: Primary key on `id`
- `newsletter_generation_queue_newsletter_id_section_type_key`: Unique index on `(newsletter_id, section_type)`
- `newsletter_generation_queue_status_idx`: Index on `status`
- `newsletter_generation_queue_newsletter_id_idx`: Index on `newsletter_id`
