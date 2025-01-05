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
   - Next Step: Draft Review

7. **Draft Review**
   - Table: `newsletters`
   - Status: `ready_to_send` -> `draft_sent`
   - Sends draft email
   - Next Step: Await Approval

8. **Approval & Contact Selection**
   - Table: `newsletters`
   - Status: `draft_sent` -> `pending_contacts`
   - Creates entries in `newsletter_contacts`
   - Next Step: Final Send

9. **Final Send**
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

### Testing Process

1. **Setup Test Environment**
   - Run `/test/setup_test_data.sql`
   - Verify data creation with diagnostic queries:
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

2. **Monitor Processing**
   - Watch queue items progress through states
   - Verify section content generation
   - Check email delivery
   - Monitor for any errors or delays

3. **Cleanup After Testing**
   - Re-run setup script to reset test data
   - Or manually clean up using DELETE statements in proper order

## Current Status: 
- Sequential processing working correctly
- Automatic state transitions implemented
- Email queuing integrated
- Error handling and logging in place
- Status tracking operational

## Current Status (Updated: 2025-01-04)

### Core Components
- OpenAI Integration
- Queue Management
- Email Integration

### Process Flow
1. Newsletter Creation
   - Creates company and newsletter records
   - Initializes sections
   - Status: Working

2. Queue Management
   - Creates queue items for each section
   - Tracks processing status
   - Status: Working

3. Content Generation
   - Uses GPT-4 for section content
   - Extracts titles and formats content
   - Status: Working

4. Image Generation
   - Uses DALL-E 3 for section images
   - Creates abstract, professional visuals
   - Status: Working

5. Email Delivery
   - Sends drafts via Brevo
   - Updates newsletter status
   - Status: Working

### Scripts and Tools
- `workflow-processor.js`: Main worker process 
- `test-workflow.js`: Testing utility 
- `cleanup-newsletters.js`: Database cleanup utility 

### Testing Status
- Basic workflow: Tested
- Content generation: Tested
- Image generation: Tested
- Email delivery: Tested
- Error handling: Basic Implementation

### Environment Requirements
Required variables in `.env.local`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

### Known Issues
- None critical at this time
- Performance metrics needed
- Retry mechanism could be enhanced

### Next Steps
1. **Monitoring & Metrics**
   - Add timing information
   - Track API usage
   - Monitor rate limits
   - Status: Planned

2. **Error Handling**
   - Add comprehensive retry mechanism
   - Add error reporting
   - Add alerting system
   - Status: Planned

3. **Performance**
   - Add caching
   - Optimize database queries
   - Add rate limiting
   - Status: Planned

4. **User Interface**
   - Add progress visualization
   - Add content preview
   - Add manual controls
   - Status: Planned

### Running the System

1. Start the worker process:
   ```bash
   node workers/workflow-processor.js
   ```

2. Run tests:
   ```bash
   node scripts/test-workflow.js
   ```

3. Clean database:
   ```bash
   node scripts/cleanup-newsletters.js
   ```

### Security Notes
- Using service role key for database operations
- Environment variables properly secured
- No sensitive data in logs
- API keys properly managed

### Maintenance Tasks
- Monitor worker process health
- Check queue processing times
- Review error logs
- Clean up test data periodically
- Monitor API usage and limits

### Database Schema
- `newsletters`: Stores newsletter information
- `newsletter_sections`: Stores individual sections
- `newsletter_generation_queue`: Manages processing queue
- `companies`: Stores company information

### API Integration
1. **OpenAI**
   - GPT-4 for content
   - DALL-E 3 for images
   - Rate limits respected

2. **Brevo**
   - SMTP email sending
   - HTML templates
   - Error handling

3. **Supabase**
   - Real-time updates
   - Row level security
   - Foreign key constraints

## Newsletter Workflow Process

## Overview
The newsletter generation and delivery process follows a structured workflow with multiple stages and status transitions.

## Workflow Stages

### 1. Content Generation
- Sections are processed in order: welcome → industry_trends → practical_tips
- Each section moves through states: pending → in_progress → completed
- Automatic progression to next section via database triggers
- All sections must be completed before compilation

### 2. Newsletter Compilation
- Triggers when all sections are completed
- Combines section content into HTML format
- Creates entry in `compiled_newsletters` table
- Sets compiled_status to 'ready' when complete

### 3. Email Queue Management
- Creates queue entries for all active contacts
- Tracks delivery status per recipient
- Updates sent_at timestamp on successful delivery
- Handles individual recipient status tracking

### 4. Status Transitions
Newsletter Status:
- draft → published → archived

Draft Status:
- draft → ready_to_send → sending → sent

Section Status:
- pending → in_progress → completed

Email Status:
- pending → sent (or failed)

## Testing and Verification

### Test Data Setup
- Use `setup_test_data.sql` for creating test environment
- Creates test company and newsletter
- Initializes sections and queue items

### Status Verification Queries
```sql
-- Check newsletter status
SELECT 
    n.subject,
    n.status as newsletter_status,
    n.draft_status,
    eq.recipient_email,
    eq.status as email_status,
    eq.sent_at,
    cn.compiled_status
FROM newsletters n
JOIN companies c ON n.company_id = c.id
JOIN email_queue eq ON eq.newsletter_id = n.id
JOIN compiled_newsletters cn ON cn.newsletter_id = n.id
WHERE c.company_name = '[COMPANY_NAME]';

-- Check section completion
SELECT 
    section_type,
    section_number,
    status,
    updated_at
FROM newsletter_sections
WHERE newsletter_id = '[NEWSLETTER_ID]'
ORDER BY section_number;
```

## Error Handling
- Failed sections remain in 'failed' status
- Email delivery failures tracked in email_queue
- Error messages stored for debugging
- Retry mechanism for failed queue items

## Best Practices
1. Always verify section completion before compilation
2. Monitor email queue status for delivery issues
3. Check error messages for failed items
4. Use test data for workflow verification
5. Maintain proper status transitions

## Monitoring
- Track section completion times
- Monitor email delivery success rates
- Check for stuck items in queue
- Review error logs regularly

Last Updated: January 4, 2025

## Database Changes Needed

1. Add new table `workflow_processes`:
```sql
CREATE TABLE workflow_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id),
    current_step TEXT NOT NULL,
    step_status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Add new table `workflow_step_logs`:
```sql
CREATE TABLE workflow_step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES workflow_processes(id),
    step_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Queue Processor Logic

The queue processor should:

1. Find active workflow processes
2. For each process:
   - Check current step status
   - If completed, trigger next step
   - If failed, handle error and retry logic
   - Update workflow_step_logs

## Status Transitions

Each step follows this status pattern:
1. `pending` - Step is waiting to start
2. `in_progress` - Step is currently executing
3. `completed` - Step finished successfully
4. `failed` - Step encountered an error

Error handling:
- If a step fails, it can be retried up to 3 times
- After 3 failures, mark as permanently failed
- Manual intervention required for permanently failed steps

## Implementation Notes

1. Each step should be idempotent
2. Steps should handle partial completion
3. Each step transition should be logged
4. Error states should be clearly tracked
5. Manual override capability should exist
6. Each step should validate prerequisites before starting
