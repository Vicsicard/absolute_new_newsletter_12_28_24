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

// Define the shape of the joined data from Supabase
interface NewsletterContactWithRelations extends Omit<NewsletterContact, 'contact_id'> {
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
        contacts!inner (
          id,
          email,
          name,
          status
        )
      `)
      .eq('newsletter_id', newsletterId)
      .eq('status', 'pending')
      .returns<NewsletterContactWithRelations[]>();

    if (contactsError) {
      throw new APIError('Failed to fetch contacts', 500);
    }

    if (!contacts) {
      throw new APIError('No contacts found for this newsletter', 404);
    }

    // Filter out inactive contacts and format for sending
    const emailContacts: EmailContact[] = contacts
      .filter(c => c.contacts?.status === 'active')
      .map(c => ({
        email: c.contacts.email,
        name: c.contacts.name || undefined
      }));

    if (emailContacts.length === 0) {
      throw new APIError('No active contacts found for this newsletter', 400);
    }

    // Send emails
    const result = await sendBulkEmails(
      emailContacts,
      newsletter.subject,
      newsletter.newsletter_sections.map(section => `
        <h2>${section.title}</h2>
        ${section.content}
        ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}">` : ''}
      `).join('\n')
    );

    // Update newsletter status based on results
    const updates: Partial<Newsletter> = {
      status: result.failed.length === 0 ? 'sent' : 'failed',
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

    // Update newsletter_contacts status
    const contactUpdates = contacts.map(contact => {
      const successfulIndex = result.successful.findIndex(s => s.email === contact.contacts.email);
      const failedIndex = result.failed.findIndex(f => f.email === contact.contacts.email);

      return {
        id: contact.id,
        status: successfulIndex !== -1 ? 'sent' as const
          : failedIndex !== -1 ? 'failed' as const
          : 'pending' as const,
        sent_at: successfulIndex !== -1 ? new Date().toISOString() : null,
        error_message: failedIndex !== -1 ? result.failed[failedIndex].error : null
      };
    });

    // Update contact statuses
    const { error: contactUpdateError } = await supabaseAdmin
      .from('newsletter_contacts')
      .upsert(contactUpdates);

    if (contactUpdateError) {
      throw new APIError('Failed to update contact statuses', 500);
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
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof APIError ? error.status : 500 }
    );
  }
}
