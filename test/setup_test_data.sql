-- Newsletter App Test Data Setup Script
-- Last Updated: January 4, 2025

-- Begin transaction
BEGIN;

-- Clean up existing test data
DELETE FROM email_queue;
DELETE FROM compiled_newsletters;
DELETE FROM workflow_logs;
DELETE FROM newsletter_generation_queue;
DELETE FROM newsletter_workflows;
DELETE FROM newsletter_sections;
DELETE FROM newsletter_contacts;
DELETE FROM contacts;
DELETE FROM newsletters;
DELETE FROM companies;

-- Create test company
INSERT INTO companies (
    company_name,
    industry,
    contact_email,
    target_audience,
    audience_description
) VALUES (
    'TechCorp Solutions',
    'Technology',
    'contact@techcorp.test',
    'Developers',
    'Software developers and technical professionals'
) RETURNING id;

-- Create test contact
INSERT INTO contacts (
    company_id,
    email,
    first_name,
    last_name,
    status
) 
SELECT 
    id,
    'contact@techcorp.test',
    'Test',
    'User',
    'active'
FROM companies
WHERE company_name = 'TechCorp Solutions';

-- Create test newsletter
INSERT INTO newsletters (
    company_id,
    subject,
    status,
    draft_status
)
SELECT 
    id,
    'TechCorp Weekly Update - January 2025',
    'draft',
    'draft'
FROM companies
WHERE company_name = 'TechCorp Solutions';

-- Create newsletter sections
INSERT INTO newsletter_sections (
    newsletter_id,
    section_number,
    section_type,
    title,
    status
)
SELECT 
    n.id,
    section_data.section_number,
    section_data.section_type,
    section_data.title,
    'pending'
FROM newsletters n
CROSS JOIN (
    VALUES 
        (1, 'welcome', 'Section 1'),
        (2, 'industry_trends', 'Section 2'),
        (3, 'practical_tips', 'Section 3')
) as section_data(section_number, section_type, title)
JOIN companies c ON n.company_id = c.id
WHERE c.company_name = 'TechCorp Solutions';

-- Create queue items
INSERT INTO newsletter_generation_queue (
    newsletter_id,
    section_type,
    section_number,
    status
)
SELECT 
    n.id,
    ns.section_type,
    ns.section_number,
    'pending'
FROM newsletters n
JOIN newsletter_sections ns ON ns.newsletter_id = n.id
JOIN companies c ON n.company_id = c.id
WHERE c.company_name = 'TechCorp Solutions';

COMMIT;

-- Verification queries
SELECT 
    c.company_name,
    n.subject,
    n.status as newsletter_status,
    n.draft_status,
    COUNT(DISTINCT ns.id) as section_count,
    COUNT(DISTINCT nq.id) as queue_items
FROM companies c
JOIN newsletters n ON n.company_id = c.id
LEFT JOIN newsletter_sections ns ON ns.newsletter_id = n.id
LEFT JOIN newsletter_generation_queue nq ON nq.newsletter_id = n.id
WHERE c.company_name = 'TechCorp Solutions'
GROUP BY c.company_name, n.subject, n.status, n.draft_status;

-- Show detailed section status
SELECT 
    ns.section_number,
    ns.section_type,
    ns.status as section_status,
    nq.status as queue_status
FROM newsletter_sections ns
JOIN newsletters n ON ns.newsletter_id = n.id
JOIN companies c ON n.company_id = c.id
LEFT JOIN newsletter_generation_queue nq ON 
    nq.newsletter_id = n.id AND 
    nq.section_type = ns.section_type AND
    nq.section_number = ns.section_number
WHERE c.company_name = 'TechCorp Solutions'
ORDER BY ns.section_number;
