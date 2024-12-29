import { EmailContact, BulkEmailResult, NewsletterStatus } from '@/types/email';
import { getSupabaseAdmin } from './supabase-admin';

if (!process.env.BREVO_API_KEY) {
  throw new Error('Missing BREVO_API_KEY environment variable');
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

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
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME
    };

    if (!sender.email || !sender.name) {
      throw new Error('Missing BREVO_SENDER_EMAIL or BREVO_SENDER_NAME environment variables');
    }

    console.log('Sending email:', {
      to,
      subject,
      sender
    });

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{
          email: to.email,
          name: to.name || to.email,
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
    console.error('Failed to send email:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to send email');
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
    failed: [],
  };

  // Send emails in batches of 50 to avoid rate limits
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < contacts.length; i += batchSize) {
    batches.push(contacts.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const sender = {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME
      };

      if (!sender.email || !sender.name) {
        throw new Error('Missing BREVO_SENDER_EMAIL or BREVO_SENDER_NAME environment variables');
      }

      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender,
          to: batch.map(contact => ({
            email: contact.email,
            name: contact.name || contact.email,
          })),
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as BrevoError;
        batch.forEach(contact => {
          results.failed.push({
            email: contact.email,
            error: `Brevo API error: ${error.message}`
          });
        });
        continue;
      }

      const data = await response.json() as BrevoEmailResponse;
      batch.forEach(contact => {
        results.successful.push({
          email: contact.email,
          messageId: data.messageId
        });
      });

      // Add delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      batch.forEach(contact => {
        results.failed.push({
          email: contact.email,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      });
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
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'sending' as NewsletterStatus,
        sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    // Send the emails
    const results = await sendBulkEmails(contacts, subject, htmlContent);

    // Update newsletter status based on results
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: results.failed.length === 0 ? 'sent' : 'failed' as NewsletterStatus,
        sent_count: results.successful.length,
        failed_count: results.failed.length,
        last_sent_status: results.failed.length === 0 ? 'success' : 'partial_failure'
      })
      .eq('id', newsletterId);

    return results;
  } catch (error) {
    // Update newsletter status to failed
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'failed' as NewsletterStatus,
        last_sent_status: 'error',
        failed_count: contacts.length
      })
      .eq('id', newsletterId);

    throw error;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailList(emails: string[]): string[] {
  return emails.filter(email => validateEmail(email));
}
