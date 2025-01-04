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

    // Get newsletter with sections, company info, and contacts
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
        ),
        contacts:newsletter_contacts!inner (
          id,
          contact:contacts!inner (
            email,
            first_name,
            last_name,
            name
          )
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
    if (typedNewsletter.compiled?.[0]?.compiled_status !== 'ready') {
      throw new APIError('Newsletter content is not ready to send', 400);
    }

    // Verify we have contacts to send to
    if (!typedNewsletter.contacts || typedNewsletter.contacts.length === 0) {
      throw new APIError('No contacts selected for newsletter', 400);
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
      throw new APIError('Failed to update newsletter to sending status', 500);
    }

    let successCount = 0;
    let failureCount = 0;

    // Send to each contact
    for (const contactEntry of typedNewsletter.contacts) {
      const contact = contactEntry.contact;
      if (!contact || !contact.email) continue;

      try {
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
      }
    }

    // Update final newsletter status
    const finalStatus: DraftStatus = failureCount === 0 ? 'sent' : 'failed';
    await supabaseAdmin
      .from('newsletters')
      .update({ 
        draft_status: finalStatus,
        sending_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    return NextResponse.json({ 
      message: 'Newsletter sending completed',
      result: {
        successful: successCount,
        failed: failureCount
      }
    });
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
