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
   - Queue items mirror section states
   - Next section automatically triggered on completion

3. **Completion and Email Distribution**
   - All sections completed triggers:
     1. Newsletter status update to `draft_sent`
     2. Retrieval of company contact email
     3. Creation of email queue entry
     4. Logging of email queuing action
   - Email queue states:
     - `pending` → `sent` / `error`
   - Full audit trail of email sending process

### Database Schema

1. **Core Tables**
   - `newsletters`: Main newsletter information
   - `newsletter_sections`: Individual section content
   - `newsletter_generation_queue`: Processing queue
   - `workflow_logs`: State transition logging
   - `email_queue`: Email distribution management

2. **Email Queue Table**
   ```sql
   CREATE TABLE email_queue (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       newsletter_id UUID REFERENCES newsletters(id),
       recipient_email TEXT NOT NULL,
       status TEXT NOT NULL DEFAULT 'pending',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       sent_at TIMESTAMP WITH TIME ZONE,
       error_message TEXT
   );
   ```

### Monitoring and Verification

1. **Status Checks**
   - All sections completed (3/3)
   - Queue items processed (3/3)
   - Newsletter status: `draft_sent`
   - Email queued for sending
   - Workflow logs show transitions

2. **Common Monitoring Queries**
   ```sql
   -- Check newsletter completion
   SELECT 
       COUNT(*) as total_sections,
       COUNT(*) FILTER (WHERE s.status = 'completed') as completed_sections
   FROM newsletters n
   JOIN newsletter_sections s ON s.newsletter_id = n.id
   WHERE n.subject = '[Newsletter Subject]'
   GROUP BY n.draft_status;

   -- Check email status
   SELECT status, created_at, sent_at 
   FROM email_queue 
   WHERE newsletter_id = '[Newsletter ID]';
   ```

### Error Handling

1. **Status Validation**
   - Unique constraints prevent duplicate processing
   - Status changes logged for debugging
   - Clear state progression tracking

2. **Transaction Safety**
   - All state changes wrapped in transactions
   - Prevents partial updates
   - Maintains data consistency

3. **Email Error Handling**
   - Failed emails tracked in email_queue
   - Error messages stored for debugging
   - Retry mechanism available

## Current Status: ✅ Fully Automated

- Sequential processing working correctly
- Automatic state transitions implemented
- Email queuing integrated
- Error handling and logging in place
- Status tracking operational

## Current Status (Updated: 2025-01-04)

### Core Components
✅ OpenAI Integration
- Using GPT-4 for content generation
- Using DALL-E 3 for image generation
- Proper error handling and retries

✅ Queue Management
- Proper initialization
- Status tracking
- Error handling
- Cleanup utilities

✅ Email Integration
- Brevo API integration
- HTML email templates
- Automatic draft sending
- Status updates
- **Email sending functionality tested successfully**

### Process Flow
1. Newsletter Creation
   - Creates company and newsletter records
   - Initializes sections
   - Status: ✅ Working

2. Queue Management
   - Creates queue items for each section
   - Tracks processing status
   - Status: ✅ Working

3. Content Generation
   - Uses GPT-4 for section content
   - Extracts titles and formats content
   - Status: ✅ Working

4. Image Generation
   - Uses DALL-E 3 for section images
   - Creates abstract, professional visuals
   - Status: ✅ Working

5. Email Delivery
   - Sends drafts via Brevo
   - Updates newsletter status
   - Status: ✅ Working

### Scripts and Tools
- `workflow-processor.js`: Main worker process ✅
- `test-workflow.js`: Testing utility ✅
- `cleanup-newsletters.js`: Database cleanup utility ✅

### Testing Status
- Basic workflow: ✅ Tested
- Content generation: ✅ Tested
- Image generation: ✅ Tested
- Email delivery: ✅ Tested
- Error handling: ✅ Basic Implementation

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
   - Status: 🔄 Planned

2. **Error Handling**
   - Add comprehensive retry mechanism
   - Add error reporting
   - Add alerting system
   - Status: 🔄 Planned

3. **Performance**
   - Add caching
   - Optimize database queries
   - Add rate limiting
   - Status: 🔄 Planned

4. **User Interface**
   - Add progress visualization
   - Add content preview
   - Add manual controls
   - Status: 🔄 Planned

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
