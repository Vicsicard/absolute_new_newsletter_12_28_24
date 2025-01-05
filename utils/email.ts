import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';
import { 
  Contact, 
  EmailContact,
  NewsletterStatus,
  DraftStatus,
  NewsletterContactStatus 
} from '@/types/email';

// Brevo API types
interface BrevoEmailAddress {
  email: string;
  name?: string | null;
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

interface EmailResult {
  messageId: string;
  sent_at: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3';

// Maximum number of retries for email sending
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Sleep utility for retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import Bottleneck from 'bottleneck';

const tokenLimit = 100000; // Example: Set max tokens per hour for Brevo
const requestLimit = 100; // Set max requests per hour

const limiter = new Bottleneck({
    maxConcurrent: 1, // Ensure one request at a time
    reservoir: requestLimit, // Max requests allowed before pause
    reservoirRefreshAmount: requestLimit,
    reservoirRefreshInterval: 60 * 60 * 1000, // Reset hourly
});

let tokenUsage = 0; // Track tokens used

setInterval(() => {
    tokenUsage = 0; // Reset token usage counter hourly
}, 60 * 60 * 1000);

// Send a single email using Brevo REST API with retries
export async function sendBrevoEmailWithLimit(request: BrevoEmailRequest, estimatedTokens: number): Promise<BrevoEmailResponse> {
    return limiter.schedule(async () => {
        if (tokenUsage + estimatedTokens > tokenLimit) {
            console.log("Token limit reached. Waiting for reset.");
            await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000)); // Wait for reset
            tokenUsage = 0;
        }

        try {
            const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY || '',
                    'content-type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
                console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
                await sleep(retryAfter * 1000);
                return sendBrevoEmailWithLimit(request, estimatedTokens);
            }

            if (!response.ok) {
                const errorData: BrevoErrorResponse = await response.json();
                // Log to api_error_logs table
                await getSupabaseAdmin().from('api_error_logs').insert({
                    endpoint: `${BREVO_API_URL}/smtp/email`,
                    method: 'POST',
                    error_message: errorData.message,
                    error_code: errorData.code,
                    metadata: {
                        status: response.status,
                        headers: Object.fromEntries(response.headers.entries())
                    }
                });
                throw new APIError(`Brevo API Error: ${errorData.message}`, response.status);
            }

            tokenUsage += estimatedTokens;
            const data: BrevoEmailResponse = await response.json();
            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            // Log unexpected errors
            await getSupabaseAdmin().from('api_error_logs').insert({
                endpoint: `${BREVO_API_URL}/smtp/email`,
                method: 'POST',
                error_message: error.message,
                stack_trace: error.stack,
                metadata: { request }
            });
            throw new APIError(`Unexpected error sending email: ${error.message}`);
        }
    });
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send a single email using Brevo API
export async function sendEmail(
  to: EmailContact,
  subject: string,
  htmlContent: string
): Promise<EmailResult> {
  // Validate required environment variables
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
    throw new Error('Missing required Brevo environment variables');
  }

  const request: BrevoEmailRequest = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME
    },
    to: [{
      email: to.email,
      name: to.name || undefined
    }],
    subject,
    htmlContent
  };

  const response = await sendBrevoEmailWithLimit(request, 1); // Assume 1 token per email
  return {
    messageId: response.messageId,
    sent_at: new Date().toISOString()
  };
}

// Send newsletter draft to the contact email
export async function sendNewsletterDraft(
  newsletterId: string,
  recipientEmail: string,
  recipientName?: string
): Promise<EmailResult> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get newsletter data with company and sections
  const { data: newsletter, error: newsletterError } = await supabaseAdmin
    .from('newsletters')
    .select(`
      *,
      company:companies (
        company_name,
        industry,
        contact_email
      ),
      sections:newsletter_sections (
        section_number,
        title,
        content,
        image_url
      )
    `)
    .eq('id', newsletterId)
    .single();

  if (newsletterError || !newsletter) {
    throw new APIError('Failed to fetch newsletter data', 500);
  }

  if (!newsletter.sections || newsletter.sections.length === 0) {
    throw new APIError('Newsletter has no sections', 400);
  }

  // Sort sections by section_number
  const sortedSections = newsletter.sections.sort((a, b) => a.section_number - b.section_number);

  // Create HTML content from sections
  let htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .section { margin: 20px 0; padding: 20px; background: #fff; }
          .section-title { color: #2c5282; font-size: 24px; margin-bottom: 15px; }
          .section-content { font-size: 16px; }
          .section-image { max-width: 100%; height: auto; margin: 15px 0; }
          .footer { margin-top: 30px; padding: 20px; background: #f7fafc; text-align: center; }
        </style>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  `;

  // Add each section to the HTML
  for (const section of sortedSections) {
    htmlContent += `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        ${section.image_url ? `<img class="section-image" src="${section.image_url}" alt="${section.title}">` : ''}
        <div class="section-content">${section.content}</div>
      </div>
    `;
  }

  // Add footer
  htmlContent += `
          <div class="footer">
            <p>Generated for ${newsletter.company.company_name}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send the email
  const result = await sendEmail(
    {
      email: recipientEmail,
      name: recipientName
    },
    `${newsletter.company.company_name} Newsletter - Draft`,
    htmlContent
  );

  // Update newsletter draft status
  const { error: updateError } = await supabaseAdmin
    .from('newsletters')
    .update({
      draft_status: 'draft_sent' as DraftStatus,
      draft_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', newsletterId);

  if (updateError) {
    console.error('Failed to update newsletter status:', updateError);
    // Don't throw here as the email was sent successfully
  }

  return result;
}

// Log email related events to the database
async function logEmailEvent(
  supabaseAdmin: any,
  newsletterId: string,
  event: {
    type: string;
    status: string;
    message: string;
    metadata?: any;
  }
) {
  try {
    await supabaseAdmin.from('api_error_logs').insert({
      endpoint: 'email_service',
      method: event.type,
      error_message: event.message,
      error_code: event.status,
      metadata: {
        newsletter_id: newsletterId,
        ...event.metadata
      },
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log email event:', error);
  }
}

// Send final newsletter to all approved contacts with improved logging
export async function sendFinalNewsletter(
  newsletterId: string
): Promise<{ successful: number; failed: number }> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Log start of sending process
    await logEmailEvent(supabaseAdmin, newsletterId, {
      type: 'SEND_NEWSLETTER',
      status: 'started',
      message: 'Starting newsletter send process'
    });

    // Get newsletter data with compiled content and contacts
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        company:companies!inner (*),
        compiled:compiled_newsletters!inner (
          html_content,
          compiled_status
        ),
        contacts:newsletter_contacts!inner (
          id,
          contact:contacts!inner (
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', newsletterId)
      .eq('draft_status', 'ready_to_send')
      .single();

    if (newsletterError || !newsletter) {
      const error = new APIError('Failed to fetch newsletter data', 500);
      await logEmailEvent(supabaseAdmin, newsletterId, {
        type: 'FETCH_NEWSLETTER',
        status: 'error',
        message: error.message,
        metadata: { error: newsletterError }
      });
      throw error;
    }

    const typedNewsletter: NewsletterWithAll = newsletter;

    // Verify compiled newsletter is ready
    if (!typedNewsletter.compiled?.[0]?.html_content) {
      const error = new APIError('Newsletter has not been compiled', 400);
      await logEmailEvent(supabaseAdmin, newsletterId, {
        type: 'VERIFY_COMPILATION',
        status: 'error',
        message: error.message
      });
      throw error;
    }

    // Verify we have contacts to send to
    if (!typedNewsletter.contacts || typedNewsletter.contacts.length === 0) {
      const error = new APIError('Newsletter has no approved contacts', 400);
      await logEmailEvent(supabaseAdmin, newsletterId, {
        type: 'VERIFY_CONTACTS',
        status: 'error',
        message: error.message
      });
      throw error;
    }

    // Update to sending status
    const { error: sendingError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'published' as NewsletterStatus,
        draft_status: 'sending' as DraftStatus,
        sending_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (sendingError) {
      const error = new APIError('Failed to update newsletter status', 500);
      await logEmailEvent(supabaseAdmin, newsletterId, {
        type: 'UPDATE_STATUS',
        status: 'error',
        message: error.message,
        metadata: { error: sendingError }
      });
      throw error;
    }

    let successCount = 0;
    let failureCount = 0;

    // Send to each contact
    for (const contactEntry of typedNewsletter.contacts) {
      const contact = contactEntry.contact;
      if (!contact || !contact.email) {
        await logEmailEvent(supabaseAdmin, newsletterId, {
          type: 'SKIP_CONTACT',
          status: 'warning',
          message: 'Skipping invalid contact',
          metadata: { contact_id: contactEntry.id }
        });
        continue;
      }

      try {
        // Log attempt
        await logEmailEvent(supabaseAdmin, newsletterId, {
          type: 'SEND_ATTEMPT',
          status: 'info',
          message: `Attempting to send to ${contact.email}`,
          metadata: { contact_id: contactEntry.id }
        });

        // Send email using compiled content
        await sendEmail(
          {
            email: contact.email,
            name: contact.first_name && contact.last_name 
              ? `${contact.first_name} ${contact.last_name}`
              : null
          },
          typedNewsletter.subject,
          typedNewsletter.compiled[0].html_content
        );

        // Update contact status to sent
        await supabaseAdmin
          .from('newsletter_contacts')
          .update({
            status: 'sent' as NewsletterContactStatus,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contactEntry.id);

        successCount++;

        // Log success
        await logEmailEvent(supabaseAdmin, newsletterId, {
          type: 'SEND_SUCCESS',
          status: 'success',
          message: `Successfully sent to ${contact.email}`,
          metadata: { contact_id: contactEntry.id }
        });
      } catch (error) {
        console.error(`Failed to send newsletter to ${contact.email}:`, error);

        // Update contact status to failed
        await supabaseAdmin
          .from('newsletter_contacts')
          .update({
            status: 'failed' as NewsletterContactStatus,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', contactEntry.id);

        failureCount++;

        // Log failure
        await logEmailEvent(supabaseAdmin, newsletterId, {
          type: 'SEND_FAILURE',
          status: 'error',
          message: `Failed to send to ${contact.email}`,
          metadata: { 
            contact_id: contactEntry.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    // Update final newsletter status
    const finalStatus: DraftStatus = failureCount === 0 ? 'sent' : 'failed';
    await supabaseAdmin
      .from('newsletters')
      .update({ 
        draft_status: finalStatus,
        sending_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_count: successCount,
        failed_count: failureCount
      })
      .eq('id', newsletterId);

    // Log completion
    await logEmailEvent(supabaseAdmin, newsletterId, {
      type: 'SEND_COMPLETE',
      status: finalStatus === 'sent' ? 'success' : 'partial_failure',
      message: `Newsletter sending completed. Success: ${successCount}, Failed: ${failureCount}`,
      metadata: { 
        successful: successCount,
        failed: failureCount
      }
    });

    return {
      successful: successCount,
      failed: failureCount
    };
  } catch (error) {
    // Log any unexpected errors
    await logEmailEvent(supabaseAdmin, newsletterId, {
      type: 'UNEXPECTED_ERROR',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: { 
        error: error instanceof Error ? error.stack : 'No stack trace'
      }
    });
    throw error;
  }
}
