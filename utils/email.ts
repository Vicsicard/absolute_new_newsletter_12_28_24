import { EmailContact, BulkEmailResult, NewsletterStatus, NewsletterContactStatus } from '@/types/email';
import { getSupabaseAdmin } from './supabase-admin';
import { APIError } from './errors';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME
};

interface BrevoEmailResponse {
  messageId: string;
}

interface BrevoError {
  code: string;
  message: string;
}

/**
 * Send a single email using Brevo API
 */
export async function sendEmail(
  to: EmailContact,
  subject: string,
  htmlContent: string
): Promise<string> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{
          email: to.email,
          name: to.name
        }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as BrevoError;
      throw new Error(`Brevo API error: ${error.message}`);
    }

    const data = await response.json() as BrevoEmailResponse;
    return data.messageId;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send bulk emails using Brevo API
 * Returns results for both successful and failed sends
 */
export async function sendBulkEmails(
  contacts: EmailContact[],
  subject: string,
  htmlContent: string
): Promise<BulkEmailResult> {
  const results: BulkEmailResult = {
    successful: [],
    failed: []
  };

  // Send emails in parallel with rate limiting
  const batchSize = 10;
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    const promises = batch.map(async (contact) => {
      try {
        const messageId = await sendEmail(contact, subject, htmlContent);
        results.successful.push({ 
          email: contact.email, 
          messageId,
          sent_at: new Date().toISOString()
        });
      } catch (error) {
        results.failed.push({
          email: contact.email,
          error: error instanceof Error ? error.message : 'Unknown error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.all(promises);
    // Rate limiting: wait 1 second between batches
    if (i + batchSize < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
  contacts: EmailContact[],
  subject: string,
  htmlContent: string
): Promise<BulkEmailResult> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Update newsletter status to sending
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sending' as NewsletterStatus,
        last_sent_status: 'Sending in progress'
      })
      .eq('id', newsletterId);

    if (updateError) {
      throw new APIError('Failed to update newsletter status', 500);
    }

    // Send the emails
    const results = await sendBulkEmails(contacts, subject, htmlContent);

    // Update newsletter status based on results
    const updates = {
      status: results.failed.length === 0 ? 'sent' : 'failed' as NewsletterStatus,
      sent_count: results.successful.length,
      failed_count: results.failed.length,
      last_sent_status: results.failed.length === 0 
        ? 'Successfully sent to all contacts' 
        : `Failed to send to ${results.failed.length} contacts`,
      sent_at: new Date().toISOString()
    };

    const { error: finalUpdateError } = await supabaseAdmin
      .from('newsletters')
      .update(updates)
      .eq('id', newsletterId);

    if (finalUpdateError) {
      throw new APIError('Failed to update newsletter final status', 500);
    }

    return results;
  } catch (error) {
    // Update newsletter status to failed
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'failed' as NewsletterStatus,
        last_sent_status: error instanceof Error ? error.message : 'Unknown error occurred'
      })
      .eq('id', newsletterId);

    throw error;
  }
}

/**
 * Validate a single email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a list of email addresses
 * Returns array of invalid email addresses
 */
export function validateEmailList(emails: string[]): string[] {
  return emails.filter(email => !validateEmail(email));
}
