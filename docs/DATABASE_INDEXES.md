# Database Structure and Indexes

This document outlines the database tables and their corresponding indexes in our Supabase database.

## Tables and Indexes

### Companies
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| company_name | text | | NO |
| industry | text | | NO |
| target_audience | text | | YES |
| audience_description | text | | YES |
| contact_email | text | | NO |
| website_url | text | | YES |
| phone_number | text | | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| companies_pkey | PRIMARY KEY | (id) |

### Newsletters
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| company_id | uuid | | NO |
| subject | text | | NO |
| draft_status | text | 'pending' | YES |
| draft_recipient_email | text | | YES |
| draft_sent_at | timestamptz | | YES |
| status | text | 'draft' | YES |
| sent_at | timestamptz | | YES |
| sent_count | integer | 0 | YES |
| failed_count | integer | 0 | YES |
| last_sent_status | text | | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| newsletters_pkey | PRIMARY KEY | (id) |
| idx_newsletters_draft_status | INDEX | (draft_status) |
| idx_newsletters_draft_recipient | INDEX | (draft_recipient_email) |
| idx_newsletters_company_id | INDEX | (company_id) |

### Newsletter Sections
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| newsletter_id | uuid | | NO |
| section_number | integer | | NO |
| title | text | | NO |
| content | text | | NO |
| image_prompt | text | | YES |
| image_url | text | | YES |
| status | text | 'active' | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| newsletter_sections_pkey | PRIMARY KEY | (id) |
| newsletter_sections_newsletter_id_section_number_key | UNIQUE | (newsletter_id, section_number) |
| idx_newsletter_sections_newsletter_id | INDEX | (newsletter_id) |

### Contacts
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| company_id | uuid | | NO |
| email | text | | NO |
| name | text | | YES |
| status | text | 'active' | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| contacts_pkey | PRIMARY KEY | (id) |
| contacts_company_id_email_key | UNIQUE | (company_id, email) |
| idx_contacts_company_id | INDEX | (company_id) |
| idx_contacts_email | INDEX | (email) |

### Newsletter Contacts
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| newsletter_id | uuid | | NO |
| contact_id | uuid | | NO |
| status | text | 'pending' | YES |
| sent_at | timestamptz | | YES |
| error_message | text | | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| newsletter_contacts_pkey | PRIMARY KEY | (id) |
| newsletter_contacts_newsletter_id_contact_id_key | UNIQUE | (newsletter_id, contact_id) |
| idx_newsletter_contacts_contact_id | INDEX | (contact_id) |
| idx_newsletter_contacts_newsletter_id | INDEX | (newsletter_id) |
| idx_newsletter_contacts_status | INDEX | (status) |

### CSV Uploads
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| company_id | uuid | | NO |
| filename | text | | NO |
| status | text | 'pending' | YES |
| error_message | text | | YES |
| processed_rows | integer | 0 | YES |
| total_rows | integer | 0 | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| csv_uploads_pkey | PRIMARY KEY | (id) |
| idx_csv_uploads_company_id | INDEX | (company_id) |
| idx_csv_uploads_status | INDEX | (status) |

### Image Generation History
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| newsletter_section_id | uuid | | NO |
| prompt | text | | NO |
| image_url | text | | YES |
| status | text | 'pending' | YES |
| error_message | text | | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| image_generation_history_pkey | PRIMARY KEY | (id) |
| idx_image_generation_newsletter_section | INDEX | (newsletter_section_id) |
| idx_image_generation_status | INDEX | (status) |

### Industry Insights
| Column Name | Data Type | Default | Nullable |
|-------------|-----------|----------|-----------|
| id | uuid | gen_random_uuid() | NO |
| company_id | uuid | | NO |
| industry | text | | NO |
| insight_type | text | | NO |
| content | text | | NO |
| metadata | jsonb | | YES |
| created_at | timestamptz | NOW() | YES |
| updated_at | timestamptz | NOW() | YES |

**Indexes:**
| Index Name | Type | Fields |
|------------|------|---------|
| industry_insights_pkey | PRIMARY KEY | (id) |
| idx_industry_insights_company_id | INDEX | (company_id) |
| idx_industry_insights_industry | INDEX | (industry) |

## Status Flows

### Newsletter Status Flow
```
draft -> draft_sent -> pending_contacts -> ready_to_send -> sending -> sent/failed
```

### Image Generation Status Flow
```
pending -> processing -> completed/failed
```

## Key Features

1. **Automatic Timestamps**: All tables include `created_at` and `updated_at` fields that are automatically managed
2. **Status Tracking**: Multiple status fields across tables to track progress of various operations
3. **Error Handling**: Dedicated error message fields for failed operations
4. **Unique Constraints**: Prevents duplicate entries for critical relationships
5. **Performance Indexes**: Optimized for common query patterns
6. **Referential Integrity**: Foreign key constraints ensure data consistency
