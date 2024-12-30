import { Database } from '@/types/database';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';
import type { NewsletterContactStatus } from '@/types/email';

type Contact = Database['public']['Tables']['contacts']['Row'];
type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];

// Brevo API types
interface BrevoEmailAddress {
  email: string;
  name: string | null | undefined;
}

interface BrevoEmailRequest {
  sender: BrevoEmailAddress;
  to: BrevoEmailAddress[];
  subject: string;
  htmlContent: string;
  headers?: Record<string, string>;
}

interface BrevoEmailResponse {
  messageId: string;
}

interface BrevoErrorResponse {
  code: string;
  message: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3';

/**
 * Send a single email using Brevo REST API
 */
async function sendBrevoEmail(request: BrevoEmailRequest): Promise<BrevoEmailResponse> {
  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY || '',
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json() as BrevoErrorResponse;
    switch (response.status) {
      case 400:
        throw new APIError('Bad request: ' + error.message, 400);
      case 401:
        throw new APIError('Unauthorized: Invalid API key', 401);
      case 402:
        throw new APIError('Payment required: Credit limit reached', 402);
      case 403:
        throw new APIError('Forbidden: Not enough credits or unauthorized sender', 403);
      case 404:
        throw new APIError('Not found: Resource not found', 404);
      case 405:
        throw new APIError('Method not allowed', 405);
      case 406:
        throw new APIError('Not acceptable: Invalid content type', 406);
      case 429:
        throw new APIError('Too many requests: Rate limit exceeded', 429);
      default:
        throw new APIError(`Email sending failed: ${error.message}`, response.status);
    }
  }

  return response.json();
}

/**
 * Send a single email using Brevo API
 */
export async function sendEmail(
  to: Pick<Contact, 'email' | 'name'>,
  subject: string,
  htmlContent: string
): Promise<string> {
  try {
    // Validate email format
    if (!validateEmail(to.email)) {
      throw new APIError('Invalid email format', 400);
    }

    // Validate required environment variables
    if (!process.env.BREVO_API_KEY) {
      throw new APIError('Missing BREVO_API_KEY environment variable', 401);
    }
    if (!process.env.BREVO_SENDER_EMAIL) {
      throw new APIError('Missing BREVO_SENDER_EMAIL environment variable', 401);
    }

    console.log('Preparing to send email with Brevo:', {
      recipient: to.email,
      subject,
    });

    const request: BrevoEmailRequest = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      to: [{
        email: to.email,
        name: to.name,
      }],
      subject,
      htmlContent,
    };

    const response = await sendBrevoEmail(request);
    console.log('Email sent successfully:', response.messageId);
    return response.messageId;

  } catch (error) {
    console.error('Failed to send email:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to send email', 500);
  }
}

/**
 * Send bulk emails using Brevo API with rate limiting
 */
export async function sendBulkEmails(
  recipients: Array<Pick<Contact, 'email' | 'name'>>,
  subject: string,
  htmlContent: string
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> {
  const batchSize = 100; // Maximum emails per batch
  const delayMs = 100; // Delay between batches to respect rate limits
  const results = {
    successful: [] as string[],
    failed: [] as Array<{ email: string; error: string }>,
  };

  // Process recipients in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    // Add delay between batches (except for first batch)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Process each recipient in the batch
    const batchPromises = batch.map(async (recipient) => {
      try {
        const messageId = await sendEmail(recipient, subject, htmlContent);
        results.successful.push(recipient.email);
        return { success: true, email: recipient.email, messageId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ email: recipient.email, error: errorMessage });
        return { success: false, email: recipient.email, error: errorMessage };
      }
    });

    // Wait for all emails in the batch to complete
    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Send a newsletter to a list of contacts
 * Returns results for both successful and failed sends
 * Updates newsletter status and contact statuses in the database
 */
export async function sendNewsletter(
  newsletterId: string,
  contacts: Contact[],
  subject: string,
  htmlContent: string
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Update newsletter status to sending
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'sending',
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
      throw new APIError('Failed to update newsletter status', 500);
    }

    // Send emails
    const results = await sendBulkEmails(contacts.map(c => ({ email: c.email, name: c.name })), subject, htmlContent);

    // Update newsletter_contacts table with results
    const successfulContacts = results.successful.map(email => ({
      newsletter_id: newsletterId,
      contact_id: contacts.find(c => c.email === email)?.id,
      status: 'sent' as NewsletterContactStatus,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const failedContacts = results.failed.map(({ email, error }) => ({
      newsletter_id: newsletterId,
      contact_id: contacts.find(c => c.email === email)?.id,
      status: 'failed' as NewsletterContactStatus,
      error_message: error,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Update newsletter_contacts status
    if (successfulContacts.length > 0) {
      const { error: successError } = await supabaseAdmin
        .from('newsletter_contacts')
        .upsert(successfulContacts, {
          onConflict: 'newsletter_id,contact_id'
        });

      if (successError) {
        console.error('Error updating successful contacts:', successError);
      }
    }

    if (failedContacts.length > 0) {
      const { error: failError } = await supabaseAdmin
        .from('newsletter_contacts')
        .upsert(failedContacts, {
          onConflict: 'newsletter_id,contact_id'
        });

      if (failError) {
        console.error('Error updating failed contacts:', failError);
      }
    }

    // Update final newsletter status
    const finalStatus = failedContacts.length === 0 ? 'sent' : 'failed';
    const { error: finalUpdateError } = await supabaseAdmin
      .from('newsletters')
      .update({
        status: finalStatus,
        sent_count: successfulContacts.length,
        failed_count: failedContacts.length,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (finalUpdateError) {
      console.error('Error updating final newsletter status:', finalUpdateError);
      throw new APIError('Failed to update final newsletter status', 500);
    }

    return {
      successful: results.successful,
      failed: results.failed
    };

  } catch (error) {
    // Update newsletter status to failed
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    throw error;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate a list of email addresses
 * Returns array of invalid email addresses
 */
export function validateEmailList(emails: string[]): string[] {
  return emails.filter(email => !validateEmail(email));
}

// Validate required environment variables on startup
if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}
