# Brevo Email Integration

## Status (Updated: 2025-01-04)
✅ Integration Complete

## Overview
The newsletter application uses Brevo (formerly Sendinblue) for sending automated emails. The integration handles draft newsletter delivery to contacts.

## Features
- ✅ HTML Email Templates
- ✅ Automated Sending
- ✅ Error Handling
- ✅ Status Tracking

## Configuration
Required environment variables in `.env.local`:
```
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=your-sender-email
BREVO_SENDER_NAME=your-sender-name
```

## Implementation
The email sending functionality is implemented in two main components:

1. **Email Service** (`src/services/email-service.ts`)
   - Handles direct interaction with Brevo API
   - Manages database transactions
   - Updates newsletter and email queue statuses
   - Comprehensive error logging
   - Uses transaction rollback for data consistency

2. **Email Worker** (`src/workers/email-worker.ts`)
   - Background process checking queue every 30 seconds
   - Uses FOR UPDATE SKIP LOCKED for safe concurrent processing
   - Picks up newsletters marked as 'sending'
   - Delegates to email service for actual sending

3. **Database Flow**
   - Newsletter marked as 'ready_to_send'
   - Email queued with 'pending' status
   - Worker picks up and updates to 'sending'
   - Final status: 'sent' or 'failed'

4. **Error Handling**
   - Catches and logs all API errors
   - Maintains transaction consistency
   - Updates both newsletter and email statuses
   - Detailed error logging in api_error_logs table

## Monitoring
The system includes comprehensive monitoring through the `newsletter_status_monitor` view:

### Status Indicators
- `workflow_state`: Current state in the process
- `priority`: High/Medium/Low based on state
- `email_health`: Active/Stuck/Failed
- `status_message`: Detailed status information

### Health Checks
- Emails stuck in 'sending' > 5 minutes
- Missing or incomplete sections
- Failed processing attempts
- Duplicate prevention

### Recommended Actions
Based on the newsletter state:
- "Add newsletter sections"
- "Complete remaining sections"
- "Trigger compilation"
- "Queue for sending"
- "Reset stuck email"
- "Check error logs and retry"

## Testing
- ✅ Email sending tested
- ✅ HTML template tested
- ✅ Error handling tested

## Known Issues
- ✅ Resolved: Improved error handling and logging
- Enhanced type safety for API interactions

## Next Steps
1. **Monitoring**
   - Add email delivery tracking
   - Monitor bounce rates
   - Track open rates
   - Implement comprehensive error logging

2. **Templates**
   - Add more template options
   - Improve mobile responsiveness
   - Add customization options

3. **Performance**
   - Rate limiting implemented
   - Token usage tracking added
   - Retry mechanisms enhanced

## API Usage
```javascript
// Example API usage
const sendBrevoEmail = async (to, subject, htmlContent) => {
  // Configuration
  const apiKey = process.env.BREVO_API_KEY;
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME
  };

  // API call
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent
    })
  });

  return response.json();
};
```

## Security Notes
- API keys stored securely
- No sensitive data in logs
- Rate limits respected
- Error handling in place

## Maintenance
- Monitor API usage
- Check email delivery rates
- Review error logs
- Update API version as needed
