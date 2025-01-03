import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/email';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { 
  EmailContact, 
  NewsletterStatus, 
  NewsletterContactStatus,
  Newsletter,
  NewsletterSection,
  NewsletterContact,
  Contact,
  NewsletterWithAll
} from '@/types/email';
import { APIError } from '@/utils/errors';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  let newsletterId: string | undefined;

  try {
    const body = await req.json();
    newsletterId = body.newsletterId;

    if (!newsletterId) {
      throw new APIError('Missing newsletter ID', 400);
    }

    // Get newsletter with sections and company info
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        company:companies!inner (*),
        newsletter_sections (
          *
        )
      `)
      .eq('id', newsletterId)
      .eq('status', 'ready_to_send')
      .order('section_number', { foreignTable: 'newsletter_sections' })
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter or newsletter not ready to send', 500);
    }

    const typedNewsletter: NewsletterWithAll = newsletter;

    // Update to sending status
    const { error: sendingError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sending' as NewsletterStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (sendingError) {
      throw new APIError('Failed to update newsletter to sending status', 500);
    }

    // Use the company's contact email
    if (!typedNewsletter.company?.contact_email) {
      throw new APIError('No contact email found for company', 404);
    }

    const emailContact: EmailContact = {
      email: typedNewsletter.company.contact_email,
      name: typedNewsletter.company.company_name || null
    };

    // Generate HTML content
    const htmlContent = typedNewsletter.newsletter_sections
      .filter(section => section.status === 'active')
      .sort((a, b) => a.section_number - b.section_number)
      .map(section => `
        <h2>${section.title}</h2>
        ${section.content}
        ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}">` : ''}
      `).join('\n');

    // Send email
    try {
      const result = await sendEmail(
        emailContact,
        typedNewsletter.subject,
        htmlContent
      );

      // Update newsletter status
      const { error: updateError } = await supabaseAdmin
        .from('newsletters')
        .update({ 
          status: 'sent' as NewsletterStatus,
          sent_count: 1,
          failed_count: 0,
          last_sent_status: 'Successfully sent to contact',
          sent_at: result.sent_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);

      if (updateError) {
        throw new APIError('Failed to update newsletter status after sending', 500);
      }

      return NextResponse.json({
        success: true,
        message: 'Newsletter sent successfully',
        data: {
          messageId: result.messageId,
          sent_at: result.sent_at
        }
      });
    } catch (error) {
      // Update newsletter status to failed
      const { error: updateError } = await supabaseAdmin
        .from('newsletters')
        .update({ 
          status: 'failed' as NewsletterStatus,
          sent_count: 0,
          failed_count: 1,
          last_sent_status: error instanceof Error ? error.message : 'Failed to send newsletter',
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);

      if (updateError) {
        console.error('Failed to update newsletter status after error:', updateError);
      }

      throw error;
    }
  } catch (error) {
    console.error('Error sending newsletter:', error);

    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      error instanceof Error ? error.message : 'Failed to send newsletter',
      500
    );
  }
}
