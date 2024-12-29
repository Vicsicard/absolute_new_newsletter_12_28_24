import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/utils/email';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { 
  EmailContact, 
  NewsletterStatus, 
  DraftStatus,
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
        created_at,
        updated_at,
        company:companies (
          company_name,
          industry,
          target_audience,
          audience_description,
          contact_email
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
      .eq('draft_status', 'pending')
      .eq('status', 'draft')
      .order('section_number', { foreignTable: 'newsletter_sections' })
      .single();

    if (newsletterError || !newsletter) {
      console.error('Newsletter error:', newsletterError);
      throw new APIError('Failed to fetch newsletter or newsletter not in pending draft status', 500);
    }

    if (!newsletter.draft_recipient_email) {
      throw new APIError('No draft recipient email found', 400);
    }

    // Transform the response to match NewsletterWithRelations type
    const typedNewsletter: NewsletterWithRelations = {
      ...newsletter,
      company: newsletter.company,
      newsletter_sections: newsletter.newsletter_sections || []
    };

    // Send email to draft recipient
    const result = await sendBulkEmails(
      [{ email: newsletter.draft_recipient_email }],
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

    // Update newsletter draft status based on results
    const updates = {
      draft_status: result.failed.length === 0 ? 'sent' : 'failed',
      draft_sent_at: result.failed.length === 0 ? new Date().toISOString() : null,
      status: result.failed.length === 0 ? 'draft_sent' : 'draft',
      last_sent_status: result.failed.length === 0 
        ? 'Successfully sent draft to recipient' 
        : `Failed to send draft: ${result.failed[0]?.error || 'Unknown error'}`
    };

    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updates)
      .eq('id', newsletterId);

    if (updateError) {
      throw new APIError('Failed to update newsletter draft status', 500);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updates,
        newsletter_id: newsletterId
      }
    });

  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
