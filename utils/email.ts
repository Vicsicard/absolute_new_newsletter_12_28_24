import { EmailContact, BulkEmailResult } from '@/types/email';
import { supabaseAdmin } from './supabase-admin';

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
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          to: batch.map(contact => ({
            email: contact.email,
            name: contact.name,
          })),
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as BrevoError;
        // If batch fails, mark all contacts in batch as failed
        batch.forEach(contact => {
          results.failed.push({
            email: contact.email,
            error: error.message,
          });
        });
        continue;
      }

      const data = await response.json() as BrevoEmailResponse;
      // Mark all contacts in successful batch as successful
      batch.forEach(contact => {
        results.successful.push({
          email: contact.email,
          messageId: data.messageId,
        });
      });
    } catch (error) {
      // If batch fails due to network error, mark all contacts as failed
      batch.forEach(contact => {
        results.failed.push({
          email: contact.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }

    // Add a small delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Send a newsletter to a list of contacts
 * Returns results for both successful and failed sends
 * Updates newsletter status if newsletterId is provided
 */
export async function sendNewsletter(
  to: EmailContact[],
  subject: string,
  htmlContent: string,
  newsletterId?: string
): Promise<BulkEmailResult> {
  const result = await sendBulkEmails(to, subject, htmlContent);

  // Update newsletter status if newsletterId is provided
  if (newsletterId) {
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: result.failed.length === 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);
  }

  return result;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailList(emails: string[]): string[] {
  return emails.filter(email => validateEmail(email));
}
