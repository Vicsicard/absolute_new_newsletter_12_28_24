import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import { Database } from '@/types/database';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';

type Contact = Database['public']['Tables']['contacts']['Row'];
type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];
type NewsletterContactStatus = Database['public']['Tables']['newsletter_contacts']['Row']['status'];

// Initialize Brevo API client with configuration
const apiInstance = new TransactionalEmailsApi();

// Configure API key authorization
apiInstance.setApiKey(TransactionalEmailsApi.name, process.env.BREVO_API_KEY || '');

// Configure default headers
apiInstance.defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Send a single email using Brevo Transactional Email API
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

    // Validate required environment variables
    if (!process.env.BREVO_API_KEY) {
      throw new Error('Missing BREVO_API_KEY environment variable');
    }
    if (!process.env.BREVO_SENDER_EMAIL) {
      throw new Error('Missing BREVO_SENDER_EMAIL environment variable');
    }

    console.log('Preparing to send email with Brevo:', {
      recipient: to.email,
      subject,
      senderEmail: process.env.BREVO_SENDER_EMAIL,
      senderName: process.env.BREVO_SENDER_NAME || 'Newsletter App'
    });

    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Newsletter App',
      email: process.env.BREVO_SENDER_EMAIL
    };
    
    sendSmtpEmail.to = [{
      email: to.email,
      name: to.name || undefined
    }];
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = htmlContent.replace(/<[^>]*>/g, '');

    // Send the email with retry logic
    const response = await retry(async () => {
      try {
        console.log('Sending email with Brevo:', {
          to: to.email,
          subject,
          senderEmail: process.env.BREVO_SENDER_EMAIL
        });

        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        
        if (!result || !result.body || !result.response || result.response.statusCode >= 400) {
          console.error('Brevo API error:', {
            status: result?.response?.statusCode,
            statusText: result?.response?.statusMessage,
            body: result?.body
          });
          throw new Error(`Brevo API error: ${result?.response?.statusMessage || 'Unknown error'}`);
        }

        console.log('Raw API Response:', {
          status: result.response.statusCode,
          body: result.body
        });
        
        return result;
      } catch (error: any) {
        console.error('Brevo API Error:', {
          message: error.message,
          response: error.response?.text,
          status: error.status,
          headers: error.response?.headers
        });
        throw error;
      }
    }, 3, 2000); // Increased retry delay to 2 seconds

    if (!response || !response.body) {
      throw new Error('No response received from Brevo API');
    }

    // Extract message ID from response
    const messageId = response.body.messageId || 'unknown';

    console.log('Email sent successfully:', {
      messageId,
      to: to.email,
      subject
    });

    return messageId;
  } catch (error) {
    console.error('Detailed error sending email:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      recipient: to.email,
      subject
    });
    throw error;
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`Retrying after ${delay}ms...`, {
      retriesLeft: retries - 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
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
 * Send bulk emails using Brevo Transactional Email API
 * Implements concurrent sending with rate limiting
 */
export async function sendBulkEmails(
  recipients: Array<Pick<Contact, 'email' | 'name'>>,
  subject: string,
  htmlContent: string
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  // Send emails in parallel with a maximum of 3 concurrent requests
  // This helps prevent rate limiting issues
  const concurrencyLimit = 3;
  for (let i = 0; i < recipients.length; i += concurrencyLimit) {
    const batch = recipients.slice(i, i + concurrencyLimit);
    const results = await Promise.allSettled(
      batch.map(recipient => 
        sendEmail(recipient, subject, htmlContent)
      )
    );

    results.forEach((result, index) => {
      const recipient = batch[index];
      if (result.status === 'fulfilled') {
        successful.push(recipient.email);
      } else {
        failed.push({
          email: recipient.email,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        });
      }
    });
  }

  if (failed.length > 0) {
    console.error('Some emails failed to send:', failed);
  }

  return { successful, failed };
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
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Update newsletter status to sending
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sending',
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
      status: results.failed.length === 0 ? 'sent' : 'failed',
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
        status: 'failed',
        last_sent_status: error instanceof Error ? error.message : 'Unknown error occurred'
      })
      .eq('id', newsletterId);

    throw error;
  }
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
