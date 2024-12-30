# Brevo Integration Guide

## Overview
This document provides comprehensive information about the Brevo email service integration in our newsletter application.

## Authentication
- API Key is stored in the environment variable `BREVO_API_KEY`
- All requests to Brevo API include the API key in the headers
- API key must have permission for transactional emails

## SDK Usage
We use the Brevo API v3.0 for sending transactional emails. The implementation is in `utils/email.ts`.

### Key Features
- Transactional email sending
- HTML content support
- Attachment handling
- Error tracking and reporting

### Example Usage
```typescript
import { sendEmail } from '@/utils/email';

await sendEmail(
  { email: 'recipient@example.com', name: 'John Doe' },
  'Newsletter Subject',
  htmlContent
);
```

## Error Handling
- Rate limiting: 300 emails per day (free tier)
- Proper error messages for common issues:
  - Invalid API key
  - Rate limit exceeded
  - Invalid email format
  - Server errors

## Best Practices
1. Always validate email addresses before sending
2. Include proper HTML formatting
3. Handle rate limits appropriately
4. Monitor email delivery status
5. Implement retry logic for failed sends

## Troubleshooting
Common issues and solutions:
- Rate limit exceeded: Wait and retry
- Invalid content: Check HTML formatting
- Authentication failed: Verify API key
- Network errors: Implement retry logic

## Migration Notes
When updating Brevo SDK:
1. Update dependencies
2. Test all email functionality
3. Verify error handling
4. Check rate limits
5. Update documentation
