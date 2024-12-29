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
  Contact
} from '@/types/email';
import { APIError } from '@/utils/errors';

interface NewsletterContactWithRelations extends NewsletterContact {
  contacts: Contact;
}

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
        created_at,
        updated_at,
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
    const emailContacts: EmailContact[] = (contacts as NewsletterContactWithRelations[] || [])
      .filter(c => c.contacts?.status === 'active')
      .map(c => ({
        email: c.contacts.email,
        name: c.contacts.name || undefined
      }));

    if (emailContacts.length === 0) {
      throw new APIError('No active contacts found for this newsletter', 400);
    }

    // Send emails
    const result = await sendBulkEmails({
      subject: newsletter.subject,
      sections: newsletter.newsletter_sections,
      contacts: emailContacts
    });

    // Update newsletter status based on results
    const updates: Partial<Newsletter> = {
      status: result.success ? 'sent' : 'failed',
      sent_count: result.data?.results?.successful.length || 0,
      failed_count: result.data?.results?.failed.length || 0,
      last_sent_status: result.message,
      sent_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updates)
      .eq('id', newsletterId);

    if (updateError) {
      throw new APIError('Failed to update newsletter status', 500);
    }

    // Update newsletter_contacts status
    if (result.data?.results) {
      const successfulEmails = new Set(result.data.results.successful.map(s => s.email));
      const failedEmails = new Set(result.data.results.failed.map(f => f.email));

      // Prepare contact status updates
      const contactUpdates = (contacts as NewsletterContactWithRelations[]).map(contact => ({
        id: contact.id,
        status: successfulEmails.has(contact.contacts.email) ? 'sent' as const
          : failedEmails.has(contact.contacts.email) ? 'failed' as const
          : 'pending' as const,
        sent_at: successfulEmails.has(contact.contacts.email) ? new Date().toISOString() : null,
        error_message: failedEmails.has(contact.contacts.email)
          ? result.data.results.failed.find(f => f.email === contact.contacts.email)?.error
          : null
      }));

      // Update contact statuses
      const { error: contactUpdateError } = await supabaseAdmin
        .from('newsletter_contacts')
        .upsert(contactUpdates);

      if (contactUpdateError) {
        throw new APIError('Failed to update contact statuses', 500);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        sent: result.data?.results?.successful.length || 0,
        failed: result.data?.results?.failed.length || 0
      }
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof APIError ? error.status : 500 }
    );
  }
}
