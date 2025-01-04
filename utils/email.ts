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

// Send a single email using Brevo REST API
async function sendBrevoEmail(request: BrevoEmailRequest): Promise<BrevoEmailResponse> {
  // Validate required environment variables
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
    throw new Error('Missing required Brevo environment variables');
  }

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
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

  const data = await response.json();
  return data as BrevoEmailResponse;
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

  const response = await sendBrevoEmail(request);
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
