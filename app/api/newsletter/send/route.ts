import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/utils/email';
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

    const emailContacts: EmailContact[] = [{
      email: typedNewsletter.company.contact_email,
      name: typedNewsletter.company.company_name || null
    }];

    // Send emails
    const result = await sendBulkEmails(
      emailContacts,
      typedNewsletter.subject,
      typedNewsletter.newsletter_sections
        .filter(section => section.status === 'active')
        .sort((a, b) => a.section_number - b.section_number)
        .map(section => `
          <h2>${section.title}</h2>
          ${section.content}
          ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}">` : ''}
        `).join('\n')
    );

    // Update newsletter status based on results
    const updates = {
      status: result.failed.length === 0 ? 'sent' : 'failed' as NewsletterStatus,
      sent_count: result.successful.length,
      failed_count: result.failed.length,
      last_sent_status: result.failed.length === 0 
        ? 'Successfully sent to all contacts' 
        : `Failed to send to ${result.failed.length} contacts`,
      sent_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updates)
      .eq('id', newsletterId);

    if (updateError) {
      throw new APIError('Failed to update newsletter status', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        sent: result.successful.length,
        failed: result.failed.length
      }
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);

    // If we have a newsletter ID, update its status to failed
    if (newsletterId) {
      await supabaseAdmin
        .from('newsletters')
        .update({
          status: 'failed' as NewsletterStatus,
          last_sent_status: error instanceof APIError ? error.message : 'Unknown error occurred'
        })
        .eq('id', newsletterId);
    }

    if (error instanceof APIError) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: error.statusCode });
    }

    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
