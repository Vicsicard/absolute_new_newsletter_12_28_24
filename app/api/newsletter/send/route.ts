import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { sendBulkEmails } from '@/utils/email';
import { ApiResponse } from '@/types/api';
import { DatabaseError } from '@/utils/errors';
import { getNewsletterWithContacts, updateNewsletterStatus, updateNewsletterContactStatus } from '@/utils/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { newsletterId } = await request.json();

    // Fetch newsletter with its company and contact information
    const newsletter = await getNewsletterWithContacts(newsletterId);
    if (!newsletter) throw new DatabaseError('Newsletter not found');

    // Filter out contacts and ensure they are active
    const activeContacts = newsletter.newsletter_contacts
      ?.filter(nc => nc.contact && nc.contact.email && nc.contact.status === 'active')
      .map(nc => ({
        newsletterContactId: nc.id,
        contact: nc.contact
      }));

    if (!activeContacts?.length) {
      throw new Error('No active contacts found for this newsletter');
    }

    // Send the newsletter
    const results = await sendBulkEmails(
      activeContacts.map(({ contact }) => ({
        email: contact.email,
        name: contact.name
      })),
      newsletter.subject,
      newsletter.content
    );

    // Update newsletter status
    await updateNewsletterStatus(
      newsletterId,
      'sent',
      new Date().toISOString()
    );

    // Update successful sends
    if (results.successful.length > 0) {
      const successfulEmails = new Set(results.successful.map(r => r.email.toLowerCase()));
      const successfulContacts = activeContacts
        .filter(({ contact }) => successfulEmails.has(contact.email.toLowerCase()));

      // Update each successful contact's status
      await Promise.all(
        successfulContacts.map(({ newsletterContactId }) =>
          updateNewsletterContactStatus(
            newsletterContactId,
            'sent',
            new Date().toISOString()
          )
        )
      );
    }

    // Update failed sends
    const failedContacts = activeContacts
      .filter(({ contact }) => 
        !results.successful.some(r => 
          r.email.toLowerCase() === contact.email.toLowerCase()
        )
      );

    if (failedContacts.length > 0) {
      // Update each failed contact's status
      await Promise.all(
        failedContacts.map(({ newsletterContactId }) =>
          updateNewsletterContactStatus(
            newsletterContactId,
            'failed'
          )
        )
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Newsletter sent successfully',
      data: {
        totalSent: results.successful.length,
        totalFailed: failedContacts.length,
        results,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send newsletter',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
