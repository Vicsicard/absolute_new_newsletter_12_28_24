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
