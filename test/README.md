# Newsletter App Test Suite

## Test Data Setup

### Overview
The test data setup script (`setup_test_data.sql`) creates a complete test environment for the newsletter workflow system. It:
1. Cleans up any existing test data
2. Creates a test company and newsletter
3. Creates all necessary sections and queue items
4. Sets up proper initial states for testing

### Running the Setup

1. **Clean and Create Test Data**
```sql
-- Run the entire setup_test_data.sql script
```

2. **Verify Setup**
```sql
-- Check newsletter and company
SELECT n.subject, n.status, n.draft_status, c.company_name
FROM newsletters n
JOIN companies c ON n.company_id = c.id
WHERE c.company_name = 'TechCorp Solutions';

-- Check sections
SELECT ns.section_number, ns.section_type, ns.status as section_status, ns.title
FROM newsletter_sections ns
JOIN newsletters n ON ns.newsletter_id = n.id
JOIN companies c ON n.company_id = c.id
WHERE c.company_name = 'TechCorp Solutions'
ORDER BY ns.section_number;

-- Check queue items
SELECT nq.section_type, nq.section_number, nq.status as queue_status, nq.attempts
FROM newsletter_generation_queue nq
JOIN newsletters n ON nq.newsletter_id = n.id
JOIN companies c ON n.company_id = c.id
WHERE c.company_name = 'TechCorp Solutions'
ORDER BY nq.section_number;
```

### Expected State After Setup

1. **Company**
   - Name: TechCorp Solutions
   - Industry: Technology
   - Contact Email: contact@techcorp.test

2. **Newsletter**
   - Subject: TechCorp Weekly Update - January 2025
   - Status: draft
   - Draft Status: draft

3. **Sections**
   - 3 sections created
   - Types: welcome, industry_trends, practical_tips
   - All in 'pending' status

4. **Queue Items**
   - 3 queue items created
   - Match section types and numbers
   - All in 'pending' status
   - 0 attempts

## Testing the Workflow

1. Start the workflow processor
2. Monitor the queue items as they progress
3. Check section content as it's generated
4. Verify email delivery
5. Check final states

## Cleanup

To reset the test environment:
1. Re-run the setup script, or
2. Manually delete data in this order:
   - workflow_logs
   - email_queue
   - newsletter_generation_queue
   - newsletter_workflows
   - compiled_newsletters
   - image_generation_history
   - newsletter_sections
   - newsletter_contacts
   - newsletters
   - companies

## Notes

- The setup script temporarily disables newsletter initialization triggers
- All foreign key constraints are properly handled
- Test data uses realistic but fictional information
