# Database Structure and Indexes

This document outlines the database tables and their corresponding indexes in our Supabase database.

## Tables and Indexes

### Companies
| Index Name | Type | Fields |
|------------|------|---------|
| companies_pkey | UNIQUE | (id) |

### Newsletters
| Index Name | Type | Fields |
|------------|------|---------|
| newsletters_pkey | UNIQUE | (id) |
| idx_newsletters_draft_status | INDEX | (draft_status) |
| idx_newsletters_draft_recipient | INDEX | (draft_recipient_email) |

### Newsletter Sections
| Index Name | Type | Fields |
|------------|------|---------|
| newsletter_sections_newsletter_id_section_number_key | UNIQUE | (newsletter_id, section_number) |
| newsletter_sections_pkey | UNIQUE | (id) |

### Contacts
| Index Name | Type | Fields |
|------------|------|---------|
| contacts_company_id_email_key | UNIQUE | (company_id, email) |
| contacts_pkey | UNIQUE | (id) |

### Newsletter Contacts
| Index Name | Type | Fields |
|------------|------|---------|
| newsletter_contacts_contact_id_idx | INDEX | (contact_id) |
| newsletter_contacts_newsletter_id_contact_id_key | UNIQUE | (newsletter_id, contact_id) |
| newsletter_contacts_newsletter_id_idx | INDEX | (newsletter_id) |
| newsletter_contacts_pkey | UNIQUE | (id) |

### CSV Uploads
| Index Name | Type | Fields |
|------------|------|---------|
| csv_uploads_pkey | UNIQUE | (id) |

### Image Generation History
| Index Name | Type | Fields |
|------------|------|---------|
| idx_image_generation_newsletter_section | INDEX | (newsletter_section_id) |
| image_generation_history_pkey | UNIQUE | (id) |

## Key Constraints and Relationships

1. Each company must have a unique ID
2. Each newsletter must have a unique ID and tracks draft email status
3. Each contact must have a unique ID and unique email per company
4. Each newsletter section must have a unique ID and unique section number per newsletter
5. Each newsletter contact association must be unique
6. Each CSV upload must have a unique ID
7. Each image generation must have a unique ID

## Newsletter Status Flow

1. Initial Status Flow:
   ```
   draft -> draft_sent -> pending_contacts -> ready_to_send -> sending -> sent/failed
   ```

2. Status Descriptions:
   - `draft`: Initial state when newsletter is created
   - `draft_sent`: Draft has been emailed to contact_email
   - `pending_contacts`: Waiting for CSV contact upload
   - `ready_to_send`: Contacts uploaded, ready for distribution
   - `sending`: Currently being distributed
   - `sent`: Successfully distributed
   - `failed`: Distribution failed

## Performance Optimizations

1. Indexes on status fields for efficient querying:
   - idx_newsletters_draft_status
   - idx_newsletters_draft_recipient

2. Indexes on foreign keys for efficient joins:
   - newsletter_contacts_contact_id_idx
   - newsletter_contacts_newsletter_id_idx
   - idx_image_generation_newsletter_section

## Important Notes

1. The contacts_company_id_email_key ensures no duplicate emails within the same company
2. The newsletter_sections_newsletter_id_section_number_key ensures sections are properly ordered
3. Draft email status tracking enables monitoring of the email delivery process
4. Contact list upload is separate from initial newsletter creation
