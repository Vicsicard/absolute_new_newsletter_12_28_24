import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/utils/email';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { updateNewsletterStatus } from '@/utils/supabase';
import type { EmailContact } from '@/types/email';
import { APIError } from '@/utils/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { newsletterId, subject, content } = await req.json();

    if (!newsletterId || !subject || !content) {
      throw new APIError('Missing required fields', 400);
    }

    // Get all contacts for this newsletter
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('newsletter_contacts')
      .select(`
        *,
        contact:contacts (*)
      `)
      .eq('newsletter_id', newsletterId);

    if (contactsError) {
      throw new APIError('Failed to fetch contacts', 500);
    }

    if (!contacts || contacts.length === 0) {
      throw new APIError('No contacts found for this newsletter', 400);
    }

    // Update newsletter status to sending
    await supabaseAdmin
      .from('newsletters')
      .update({ status: 'sending' })
      .eq('id', newsletterId);

    // Send the newsletter
    const results = await sendBulkEmails(
      contacts.map(c => ({
        email: c.contact.email,
        name: c.contact.name
      })),
      subject,
      content
    );

    // Update newsletter status based on results
    await supabaseAdmin
      .from('newsletters')
      .update({ 
        status: results.failed.length === 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    // Update contact statuses
    const successful = new Set(results.successful.map(s => s.email));
    await Promise.all(contacts.map(async (contact) => {
      const status = successful.has(contact.contact.email) ? 'sent' : 'failed';
      await supabaseAdmin
        .from('newsletter_contacts')
        .update({ status })
        .eq('id', contact.id);
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalSent: results.successful.length,
        totalFailed: results.failed.length,
        failed: results.failed
      }
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof APIError ? error.message : 'Failed to send newsletter',
    }, { status: error instanceof APIError ? error.status : 500 });
  }
}
