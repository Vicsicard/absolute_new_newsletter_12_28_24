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
  NewsletterWithAll,
  DraftStatus
} from '@/types/email';
import { APIError } from '@/utils/errors';
import { withErrorHandler } from '@/utils/api-middleware';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(async (req: Request) => {
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
        sections:newsletter_sections (
          *
        ),
        compiled:compiled_newsletters!inner (
          html_content,
          compiled_status
        )
      `)
      .eq('id', newsletterId)
      .eq('draft_status', 'ready_to_send')
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter or newsletter not ready to send', 500);
    }

    const typedNewsletter: NewsletterWithAll = newsletter;

    // Verify compiled newsletter is ready
    if (!typedNewsletter.compiled?.compiled_status === 'ready') {
      throw new APIError('Newsletter content is not ready to send', 400);
    }

    // Update to sending status
    const { error: sendingError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        draft_status: 'sending' as DraftStatus,
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

    // Send email using compiled content
    try {
      const result = await sendEmail(
        emailContact,
        typedNewsletter.subject,
        typedNewsletter.compiled.html_content
      );

      // Update newsletter status to sent
      const { error: updateError } = await supabaseAdmin
        .from('newsletters')
        .update({ 
          draft_status: 'sent' as DraftStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);

      if (updateError) {
        throw new APIError('Failed to update newsletter status after sending', 500);
      }

      // Update compiled newsletter status
      const { error: compiledError } = await supabaseAdmin
        .from('compiled_newsletters')
        .update({
          compiled_status: 'sent' as NewsletterStatus,
          updated_at: new Date().toISOString()
        })
        .eq('newsletter_id', newsletterId);

      if (compiledError) {
        console.error('Failed to update compiled newsletter status:', compiledError);
      }

      // Create newsletter contact record
      const { error: contactError } = await supabaseAdmin
        .from('newsletter_contacts')
        .insert({
          newsletter_id: newsletterId,
          contact_id: emailContact.id,
          status: 'sent' as NewsletterContactStatus,
          sent_at: result.sent_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (contactError) {
        console.error('Failed to create newsletter contact record:', contactError);
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
          draft_status: 'failed' as DraftStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);

      if (updateError) {
        console.error('Failed to update newsletter status after error:', updateError);
      }

      // Update compiled newsletter status
      const { error: compiledError } = await supabaseAdmin
        .from('compiled_newsletters')
        .update({
          compiled_status: 'error' as NewsletterStatus,
          updated_at: new Date().toISOString()
        })
        .eq('newsletter_id', newsletterId);

      if (compiledError) {
        console.error('Failed to update compiled newsletter status:', compiledError);
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
});
