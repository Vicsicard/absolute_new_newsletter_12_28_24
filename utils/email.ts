import { Database } from '@/types/database';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';

type Contact = Database['public']['Tables']['contacts']['Row'];
type Newsletter = Database['public']['Tables']['newsletters']['Row'];
type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];

interface BrevoEmailResponse {
  messageId: string;
}

interface BrevoError {
  code: string;
  message: string;
}

export interface BulkEmailResult {
  successful: Array<{
    email: string;
    messageId: string;
    sent_at: string;
  }>;
  failed: Array<{
    email: string;
    error: string;
    error_message: string;
  }>;
}

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME
};

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
      console.error('Invalid email format:', to.email);
      throw new Error(`Invalid email format: ${to.email}`);
    }

    console.log('Attempting to send email:', {
      to: to.email,
      subject,
      sender: SENDER.email,
      apiUrl: BREVO_API_URL,
      hasApiKey: !!BREVO_API_KEY,
      contentLength: htmlContent.length
    });

    // Validate Brevo configuration
    if (!BREVO_API_KEY || !SENDER.email || !SENDER.name) {
      console.error('Missing Brevo configuration:', {
        hasApiKey: !!BREVO_API_KEY,
        hasSenderEmail: !!SENDER.email,
        hasSenderName: !!SENDER.name
      });
      throw new Error('Invalid Brevo configuration');
    }

    const emailData = {
      sender: SENDER,
      to: [{
        email: to.email,
        name: to.name || undefined // Use undefined to match database schema
      }],
      subject,
      htmlContent,
      textContent: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    console.log('Sending email with data:', {
      ...emailData,
      htmlContent: `${emailData.htmlContent.substring(0, 100)}...` // Log just the start
    });

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    console.log('Brevo API response status:', response.status);
    console.log('Brevo API response headers:', Object.fromEntries(response.headers.entries()));
    const responseText = await response.text();
    console.log('Brevo API raw response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(responseText) as BrevoError;
        errorMessage = `Brevo API error: ${errorData.message} (Code: ${errorData.code})`;
      } catch {
        errorMessage = `Brevo API error (${response.status}): ${responseText}`;
      }
      console.error('Email sending failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    let data: BrevoEmailResponse;
    try {
      data = JSON.parse(responseText);
      console.log('Email sent successfully:', {
        messageId: data.messageId,
        to: to.email,
        subject
      });
      return data.messageId;
    } catch (error) {
      console.error('Error parsing Brevo API response:', {
        error,
        responseText
      });
      throw new Error('Failed to parse Brevo API response');
    }
  } catch (error) {
    console.error('Error sending email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Send bulk emails using Brevo API
 * Returns results for both successful and failed sends
 */
export async function sendBulkEmails(
  contacts: Pick<Contact, 'email' | 'name'>[],
  subject: string,
  htmlContent: string
): Promise<BulkEmailResult> {
  const results: BulkEmailResult = {
    successful: [],
    failed: []
  };

  for (const contact of contacts) {
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
        error: error instanceof Error ? error.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
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
  contacts: Pick<Contact, 'email' | 'name'>[],
  subject: string,
  htmlContent: string
): Promise<BulkEmailResult> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Update newsletter status to sending
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sending' as Newsletter['status'],
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
      status: results.failed.length === 0 ? 'sent' : 'failed' as Newsletter['status'],
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
        status: 'failed' as Newsletter['status'],
        last_sent_status: error instanceof Error ? error.message : 'Unknown error occurred'
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
