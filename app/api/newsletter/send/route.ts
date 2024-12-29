import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/utils/email';
import { supabaseAdmin } from '@/utils/supabase-admin';
import type { EmailContact, NewsletterStatus } from '@/types/email';
import type { Database } from '@/types/database';
import { APIError } from '@/utils/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NewsletterSection = Database['public']['Tables']['newsletter_sections']['Row'];

export async function POST(req: Request) {
  try {
    const { newsletterId } = await req.json();

    if (!newsletterId) {
      throw new APIError('Missing newsletter ID', 400);
    }

    // Get newsletter with sections
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        sections:newsletter_sections(*)
      `)
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter', 500);
    }

    // Get all contacts for this newsletter
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('newsletter_contacts')
      .select(`
        *,
        contact:contacts (*)
      `)
      .eq('newsletter_id', newsletterId)
      .eq('status', 'pending');

    if (contactsError) {
      throw new APIError('Failed to fetch contacts', 500);
    }

    if (!contacts || contacts.length === 0) {
      throw new APIError('No pending contacts found for this newsletter', 400);
    }

    // Update newsletter status to sending
    await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: 'sending',
        sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    // Format sections into HTML
    const formattedContent = newsletter.sections
      .sort((a: NewsletterSection, b: NewsletterSection) => 
        a.section_number - b.section_number)
      .map((section: NewsletterSection) => `
        <div class="newsletter-section">
          <h2>${section.title}</h2>
          ${section.content}
          ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}" style="max-width: 100%; height: auto;">` : ''}
        </div>
      `)
      .join('\n');

    // Send the newsletter
    const results = await sendBulkEmails(
      contacts.map(c => ({
        email: c.contact.email,
        name: c.contact.name
      })),
      newsletter.subject,
      formattedContent
    );

    // Update contact statuses
    const updates = contacts.map(contact => {
      const wasSuccessful = results.successful.some(r => r.email === contact.contact.email);
      const failedResult = results.failed.find(f => f.email === contact.contact.email);
      
      return supabaseAdmin
        .from('newsletter_contacts')
        .update({
          status: wasSuccessful ? 'sent' : 'failed',
          sent_at: wasSuccessful ? new Date().toISOString() : null,
          error_message: failedResult?.error || null
        })
        .eq('id', contact.id);
    });

    await Promise.all(updates);

    // Update newsletter status and counts
    await supabaseAdmin
      .from('newsletters')
      .update({
        status: results.failed.length === 0 ? 'sent' : 'failed',
        sent_count: results.successful.length,
        failed_count: results.failed.length,
        last_sent_status: results.failed.length === 0 ? 'success' : 'partial_failure'
      })
      .eq('id', newsletterId);

    return NextResponse.json({
      success: true,
      data: {
        successful: results.successful.length,
        failed: results.failed.length
      }
    });
  } catch (error) {
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
