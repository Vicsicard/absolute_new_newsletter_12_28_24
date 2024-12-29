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
  NewsletterWithRelations
} from '@/types/email';
import { APIError } from '@/utils/errors';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

// Configure API route
export const runtime = 'edge';
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
        company:companies (
          id,
          company_name,
          industry,
          contact_email,
          target_audience,
          audience_description
        ),
        newsletter_sections (
          id,
          newsletter_id,
          section_number,
          title,
          content,
          image_prompt,
          image_url,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('id', newsletterId)
      .eq('status', 'ready_to_send')
      .order('section_number', { foreignTable: 'newsletter_sections' })
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter or newsletter not ready to send', 500);
    }

    // Type assertion to ensure newsletter has the correct shape
    const typedNewsletter = newsletter as NewsletterWithRelations;

    // Update to sending status
    const { error: sendingError } = await supabaseAdmin
      .from('newsletters')
      .update({ status: 'sending' as NewsletterStatus })
      .eq('id', newsletterId);

    if (sendingError) {
      throw new APIError('Failed to update newsletter to sending status', 500);
    }

    // Get all pending contacts for this newsletter
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('newsletter_contacts')
      .select(`
        id,
        newsletter_id,
        contact_id,
        status,
        sent_at,
        error_message,
        created_at,
        updated_at,
        contact:contacts!inner (
          id,
          company_id,
          email,
          name,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('newsletter_id', newsletterId)
      .eq('status', 'pending')
      .returns<(NewsletterContact & { contact: Contact })[]>();

    if (contactsError) {
      throw new APIError('Failed to fetch contacts', 500);
    }

    if (!contacts || contacts.length === 0) {
      throw new APIError('No pending contacts found for this newsletter', 404);
    }

    // Filter out inactive contacts and format for sending
    const emailContacts: EmailContact[] = contacts
      .filter(c => c.contact?.status === 'active')
      .map(c => ({
        email: c.contact.email,
        name: c.contact.name || undefined
      }));

    if (emailContacts.length === 0) {
      throw new APIError('No active contacts found for this newsletter', 400);
    }

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

    // Update contact statuses
    const contactUpdates = contacts.map(contact => ({
      id: contact.id,
      status: result.successful.find(s => s.email === contact.contact.email)
        ? 'sent' as NewsletterContactStatus
        : result.failed.find(f => f.email === contact.contact.email)
        ? 'failed' as NewsletterContactStatus
        : 'pending' as NewsletterContactStatus,
      sent_at: result.successful.find(s => s.email === contact.contact.email)
        ? new Date().toISOString()
        : null,
      error_message: result.failed.find(f => f.email === contact.contact.email)?.error || null
    }));

    const { error: contactUpdateError } = await supabaseAdmin
      .from('newsletter_contacts')
      .upsert(contactUpdates);

    if (contactUpdateError) {
      throw new APIError('Failed to update contact statuses', 500);
    }

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      result: {
        successful: result.successful.length,
        failed: result.failed.length
      }
    });
  } catch (error) {
    // If there's an error and we have a newsletter ID, update its status to failed
    if (newsletterId) {
      await supabaseAdmin
        .from('newsletters')
        .update({
          status: 'failed' as NewsletterStatus,
          last_sent_status: error instanceof APIError ? error.message : 'Failed to send newsletter'
        })
        .eq('id', newsletterId);
    }

    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof APIError ? error.message : 'Failed to send newsletter'
      }, 
      { status: error instanceof APIError ? error.statusCode : 500 }
    );
  }
}
