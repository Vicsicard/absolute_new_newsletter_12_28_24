# Newsletter Generation Workflow Process

## Workflow Steps

1. **Newsletter Creation** (Initial Trigger)
   - Table: `newsletters`
   - Initial Status: `draft`
   - Completion Status: `initialized`
   - Next Step: Queue Generation

2. **Queue Generation**
   - Table: `newsletter_generation_queue`
   - Creates entries for each section
   - Status: `pending`
   - Next Step: Section 1 Generation

3. **Section 1 Generation (Welcome)**
   - Tables: 
     - `newsletter_generation_queue`
     - `newsletter_sections`
   - Queue Status: `in_progress` -> `completed`
   - Section Status: `pending` -> `in_progress` -> `completed`
   - Next Step: Section 2 Generation

4. **Section 2 Generation (Industry Trends)**
   - Tables:
     - `newsletter_generation_queue`
     - `newsletter_sections`
   - Queue Status: `in_progress` -> `completed`
   - Section Status: `pending` -> `in_progress` -> `completed`
   - Next Step: Section 3 Generation

5. **Section 3 Generation (Practical Tips)**
   - Tables:
     - `newsletter_generation_queue`
     - `newsletter_sections`
   - Queue Status: `in_progress` -> `completed`
   - Section Status: `pending` -> `in_progress` -> `completed`
   - Next Step: Newsletter Compilation

6. **Newsletter Compilation**
   - Table: `compiled_newsletters`
   - Status: `pending` -> `completed`
   - Updates newsletter.draft_status to `ready_to_send`
   - Next Step: Email Sending

7. **Email Sending**
   - Table: `email_queue`
   - Status: `pending` -> `sending` -> `sent`
   - Updates newsletter.draft_status to `sent`
   - Next Step: Draft Review

8. **Draft Review**
   - Table: `newsletters`
   - Status: `sent` -> `draft_sent`
   - Sends draft email
   - Next Step: Await Approval

9. **Approval & Contact Selection**
   - Table: `newsletters`
   - Status: `draft_sent` -> `pending_contacts`
   - Creates entries in `newsletter_contacts`
   - Next Step: Final Send

10. **Final Send**
   - Tables:
     - `newsletters`
     - `newsletter_contacts`
   - Newsletter Status: `pending_contacts` -> `sending` -> `sent`
   - Contact Status: `pending` -> `sent`

## Automated Workflow Implementation (Updated: 2025-01-04)

### Database Triggers and State Management

1. **Newsletter Initialization**
   - Trigger: `handle_newsletter_initialization`
   - Creates queue items and section placeholders
   - Sets initial states for processing
   - Note: Trigger is temporarily disabled during test data setup

2. **Queue Processing**
   - Trigger: `handle_queue_status_transition`
   - Manages state transitions between sections
   - Automatically triggers next section when current completes
   - Updates newsletter status on completion
   - Queues email for sending when complete

3. **Status Tracking**
   - Table: `workflow_logs`
   - Tracks all state transitions
   - Records timing of each step
   - Enables debugging and monitoring

### Test Data Setup

1. **Database Cleanup**
   - Proper order of deletion to handle foreign key constraints:
     1. Delete workflow_logs (references newsletters)
     2. Delete email_queue (references newsletters)
     3. Delete newsletter_generation_queue (references newsletters)
     4. Delete newsletter_workflows (references newsletters)
     5. Delete compiled_newsletters (references newsletters)
     6. Delete image_generation_history (references newsletter_sections)
     7. Delete newsletter_sections (references newsletters)
     8. Delete newsletter_contacts (references newsletters)
     9. Delete newsletters
     10. Delete companies

2. **Test Data Creation**
   - Creates test company "TechCorp Solutions"
   - Creates draft newsletter
   - Creates three sections (welcome, industry_trends, practical_tips)
   - Creates corresponding queue items
   - All items start in 'pending' status
   - Located in: `/test/setup_test_data.sql`

### Workflow Steps (Automated)

1. **Newsletter Creation**
   - Status: `draft`
   - Draft Status: `ready_to_send`
   - Automatically creates three sections:
     - Welcome (section 1)
     - Industry Trends (section 2)
     - Practical Tips (section 3)

2. **Section Processing**
   - Automatic progression through sections
   - Each section moves through states:
     - `pending` → `in_progress` → `completed`

3. **Email Sending**
   - Table: `email_queue`
   - Status: `pending` -> `sending` -> `sent`
   - Updates newsletter.draft_status to `sent`

### Email Sending Workflow

### Status Flow
1. **Section Completion**
   - All sections marked as 'completed'
   - Triggers `check_sections_completion()`
   - Newsletter compiled and marked as 'ready'

2. **Email Queue Creation**
   - Newsletter status → 'ready_to_send'
   - Email queued with status 'pending'
   - Recipient email copied from newsletter.draft_recipient_email

3. **Email Processing**
   - Email queue status → 'sending'
   - Newsletter status → 'sending'
   - Content taken from compiled_newsletters.html_content

4. **Completion**
   - Success: 
     - Email status → 'sent'
     - Newsletter status → 'sent' and 'published'
   - Failure:
     - Email status → 'failed'
     - Newsletter status → 'failed'

### Status Values
1. **Newsletter Status**
   - `draft`: Initial state
   - `ready_to_send`: All sections completed
   - `sending`: Email in process
   - `sent`: Email delivered
   - `failed`: Email failed
   - `published`: Newsletter fully processed

2. **Email Queue Status**
   - `pending`: Ready to send
   - `sending`: In process
   - `sent`: Successfully delivered
   - `failed`: Failed to send

3. **Section Status**
   - `pending`: Not started
   - `in_progress`: Being worked on
   - `completed`: Done
   - `failed`: Error occurred

### Error Handling
1. **Timeout Handling**
   - Emails stuck in 'pending' or 'sending' for > 5 minutes marked as failed
   - Automatic cleanup process resets stuck newsletters
   - Error messages logged in api_error_logs

2. **Duplicate Prevention**
   - Unique constraint on email_queue(newsletter_id)
   - Transaction-level consistency in status updates
   - Race condition prevention in triggers

### Database Tables
1. **newsletters**
   - Tracks overall newsletter status
   - Contains draft recipient email
   - Links to all related entities

2. **newsletter_sections**
   - Individual section content
   - Status tracking per section
   - Ordered by section_number

3. **compiled_newsletters**
   - Combined HTML content
   - Compilation status
   - One-to-one with newsletters

4. **email_queue**
   - Email sending status
   - Recipient information
   - Error tracking

5. **api_error_logs**
   - Detailed error tracking
   - Status transition logging
   - API response logging

### Monitoring
1. **Stuck Items**
   ```sql
   SELECT 
       n.subject,
       n.draft_status,
       eq.status as email_status,
       eq.created_at as queued_at,
       eq.updated_at as last_update,
       CASE 
           WHEN eq.updated_at < NOW() - INTERVAL '5 minutes' THEN 'Stuck'
           ELSE 'Active'
       END as queue_state
   FROM newsletters n
   JOIN email_queue eq ON eq.newsletter_id = n.id
   ORDER BY eq.created_at DESC;
   ```

2. **Error Logs**
   ```sql
   SELECT 
       created_at,
       endpoint,
       error_message,
       metadata
   FROM api_error_logs
   WHERE endpoint = 'email_queue'
   ORDER BY created_at DESC;
   ```

### Maintenance
1. **Cleanup Function**
   ```sql
   SELECT cleanup_stuck_emails();
   ```
   - Runs automatically via trigger
   - Can be manually executed
   - Logs all cleanup actions

2. **Status Reset**
   ```sql
   UPDATE newsletters
   SET draft_status = 'draft'
   WHERE draft_status = 'sending'
   AND updated_at < NOW() - INTERVAL '5 minutes';
   ```

## System Maintenance and Monitoring

### Automated Health Checks

The system performs automated health checks for:
1. **Newsletter Status**
   - Stuck newsletters (> 30 minutes in sending)
   - Failed newsletters
   - Content generation issues
   - Email queue status

2. **System Alerts**
   - Automatic email notifications to vicsicard@gmail.com
   - Priority-based alerting
   - Detailed error tracking
   - Status monitoring

3. **Maintenance Tasks**
   - Cleanup of stuck newsletters
   - Reset of failed processes
   - System health logging
   - Alert processing

### Monitoring Dashboard

Check system health using:
```sql
-- Quick health check
SELECT * FROM system_health_dashboard;

-- Detailed system summary
SELECT * FROM get_system_summary();

-- View pending alerts
SELECT * FROM alert_monitor;
```

### Alert Thresholds

1. **Email Sending**
   - Timeout: 30 minutes
   - Status: Automatic reset and alert

2. **Content Generation**
   - Timeout: 60 minutes
   - Status: Automatic reset and alert

3. **System Health**
   - Check Frequency: Every 15 minutes
   - Alert Conditions:
     - Stuck newsletters
     - Failed processes
     - Queue buildup

### Maintenance Schedule

1. **Health Checks**
   ```sql
   -- Run every 15 minutes
   SELECT check_system_health();
   ```

2. **Cleanup Process**
   ```sql
   -- Run every 30 minutes
   SELECT maintenance_cleanup_stuck_newsletters();
   ```

3. **Alert Processing**
   ```sql
   -- Run every 5 minutes
   SELECT process_system_alerts();
   ```

### Monitoring Views

1. **System Health Dashboard**
   - Overall system status
   - Newsletter counts by state
   - Alert counts
   - Maintenance statistics

2. **Alert Monitor**
   - Pending alerts
   - Alert history
   - Response times
   - Alert categories

3. **Maintenance Logs**
   - Cleanup operations
   - Reset actions
   - System interventions
   - Success/failure tracking

### Recovery Procedures

1. **Stuck Newsletters**
   ```sql
   -- Manual reset if needed
   UPDATE newsletters 
   SET draft_status = 'draft',
       error_message = NULL,
       updated_at = NOW()
   WHERE draft_status = 'failed';
   ```

2. **Failed Email Queue**
   ```sql
   -- Reset failed queue items
   UPDATE email_queue
   SET status = 'pending',
       error_message = NULL,
       updated_at = NOW()
   WHERE status = 'failed';
   ```

### Best Practices

1. **Regular Monitoring**
   - Check system_health_dashboard daily
   - Review alert_monitor for patterns
   - Investigate repeated failures

2. **Maintenance**
   - Keep maintenance_logs for 30 days
   - Review error patterns weekly
   - Adjust timeouts if needed

3. **Alerts**
   - Acknowledge alerts promptly
   - Document recurring issues
   - Update contact email if needed

### Troubleshooting

1. **High Alert Volume**
   - Check for API issues
   - Review timeout settings
   - Monitor system resources

2. **Stuck Processes**
   - Review error messages
   - Check API responses
   - Verify network connectivity

3. **System Health**
   - Monitor database connections
   - Check API rate limits
   - Verify email service status

### Contact Information

For system alerts and maintenance:
- Email: vicsicard@gmail.com
- Alert Types: Failures, Stuck Items, System Health
- Response Time: 15-30 minutes

## Status Monitoring

### Newsletter States
1. **Draft Stage**
   - `needs_sections`: Newsletter created but no sections added
   - `sections_pending`: Some sections incomplete
   - `ready_to_compile`: All sections completed

2. **Sending Stage**
   - `ready_for_queue`: Ready to be picked up by email worker
   - `queued`: In email queue
   - `sending`: Email being sent
   - `completed`: Successfully sent
   - `failed`: Failed to send

### Health Monitoring
```sql
-- Check newsletter status
SELECT 
    subject,
    workflow_state,
    priority,
    total_sections,
    completed_sections,
    email_status,
    email_health,
    minutes_since_update,
    recommended_action,
    status_message
FROM newsletter_status_monitor
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        ELSE 3 
    END,
    newsletter_created DESC;
```

### Priority Levels
- **High**: 
  - Stuck emails
  - Failed newsletters
  - Error conditions
- **Medium**:
  - Active sending
  - Ready to send
- **Low**:
  - Draft state
  - Completed newsletters

### Health Indicators
1. **Email Health**
   - `active`: Currently sending
   - `stuck`: No updates for > 5 minutes
   - `failed`: Failed to send
   - `sent`: Successfully delivered

2. **Section Status**
   - Total sections vs completed sections
   - All sections must be completed before sending

3. **Time Tracking**
   - Minutes since last update
   - Automatic cleanup after 5 minutes stuck

### Maintenance Procedures

1. **Cleanup Stuck Newsletters**
```sql
-- Reset stuck newsletters
SELECT * FROM cleanup_stuck_newsletters();
```

2. **Prevent Duplicates**
```sql
-- Unique index on draft newsletters
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_draft_newsletter_subject 
ON newsletters (subject) 
WHERE draft_status = 'draft';
```

3. **Monitor Email Queue**
```sql
-- Check for stuck emails
SELECT *
FROM newsletter_status_monitor
WHERE email_health = 'stuck'
ORDER BY minutes_since_update DESC;
```

### Best Practices

1. **Regular Monitoring**
   - Check newsletter_status_monitor every 5 minutes
   - Review high priority items immediately
   - Monitor email sending success rate

2. **Error Handling**
   - Review api_error_logs for failed newsletters
   - Reset stuck newsletters promptly
   - Verify Brevo API status on failures

3. **Data Maintenance**
   - Clean up completed newsletters weekly
   - Archive old newsletters monthly
   - Maintain unique newsletter subjects

4. **Performance**
   - Index maintenance
   - Queue processing optimization
   - Status update efficiency

### Troubleshooting Guide

1. **Stuck Newsletters**
   - Check email_queue status
   - Review api_error_logs
   - Run cleanup_stuck_newsletters()
   - Verify Brevo API status

2. **Missing Sections**
   - Verify section creation
   - Check completion triggers
   - Review section content

3. **Failed Sending**
   - Check Brevo API response
   - Verify email format
   - Check recipient address

### Recovery Procedures

1. **Reset Failed Newsletter**
```sql
UPDATE newsletters
SET draft_status = 'draft'
WHERE draft_status = 'failed';
```

2. **Requeue Email**
```sql
UPDATE email_queue
SET status = 'pending',
    updated_at = NOW()
WHERE status = 'failed';
```

3. **Reset Stuck Process**
```sql
SELECT * FROM reset_stuck_newsletter(newsletter_id);
```

## Integration Testing
Test the complete workflow using:
```sql
-- Create test newsletter
INSERT INTO newsletters (subject, draft_recipient_email, draft_status)
VALUES ('Test Newsletter', 'test@example.com', 'draft');

-- Create and complete sections
-- Monitor status transitions
-- Check email queue
-- Verify final states
```

For detailed test cases, see BREVO_INTEGRATION.md
