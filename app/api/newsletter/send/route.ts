import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/utils/email';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { 
  EmailContact, 
  NewsletterStatus, 
  NewsletterContactStatus,
  Newsletter,
  NewsletterSection,
  NewsletterContact
} from '@/types/email';
import { APIError } from '@/utils/errors';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { newsletterId } = await req.json();

    if (!newsletterId) {
      throw new APIError('Missing newsletter ID', 400);
    }

    // Get newsletter with sections and company info
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        id,
        company_id,
        subject,
        draft_status,
        draft_recipient_email,
        draft_sent_at,
        status,
        sent_at,
        sent_count,
        failed_count,
        last_sent_status,
        companies (
          id,
          company_name,
          industry,
          contact_email,
          target_audience,
          audience_description
        ),
        newsletter_sections (
          id,
          section_number,
          title,
          content,
          image_url,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('id', newsletterId)
      .order('section_number', { foreignTable: 'newsletter_sections' })
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter', 500);
    }

    // Get all active contacts for this newsletter
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('newsletter_contacts')
      .select(`
        id,
        newsletter_id,
        contact_id,
        status,
        sent_at,
        error_message,
        contacts (
          id,
          email,
          name,
          status
        )
      `)
      .eq('newsletter_id', newsletterId)
      .eq('status', 'pending');

    if (contactsError) {
      throw new APIError('Failed to fetch contacts', 500);
    }

    // Filter out inactive contacts and format for sending
    const emailContacts: EmailContact[] = contacts
      ?.filter(c => c.contacts?.status === 'active')
      .map(c => ({
        email: c.contacts.email,
        name: c.contacts.name || undefined
      })) || [];

    if (emailContacts.length === 0) {
      throw new APIError('No active contacts found for this newsletter', 400);
    }

    // Send the newsletter
    const results = await sendBulkEmails(
      emailContacts,
      newsletter.subject,
      newsletter.content
    );

    // Update newsletter status
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({
        status: results.failed.length === 0 ? 'sent' : 'failed' as NewsletterStatus,
        sent_at: new Date().toISOString(),
        sent_count: results.successful.length,
        failed_count: results.failed.length,
        last_sent_status: results.failed.length === 0 ? 'success' : 'partial_failure'
      })
      .eq('id', newsletterId);

    if (updateError) {
      throw new APIError('Failed to update newsletter status', 500);
    }

    // Update newsletter_contacts status
    for (const success of results.successful) {
      const contact = contacts?.find(c => c.contacts?.email === success.email);
      if (contact) {
        await supabaseAdmin
          .from('newsletter_contacts')
          .update({
            status: 'sent' as NewsletterContactStatus,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);
      }
    }

    for (const failure of results.failed) {
      const contact = contacts?.find(c => c.contacts?.email === failure.email);
      if (contact) {
        await supabaseAdmin
          .from('newsletter_contacts')
          .update({
            status: 'failed' as NewsletterContactStatus,
            error_message: failure.error,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        newsletter_id: newsletterId,
        total_sent: results.successful.length,
        total_failed: results.failed.length,
        sent_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send newsletter'
      },
      { status: error instanceof APIError ? error.status : 500 }
    );
  }
}
