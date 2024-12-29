import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { sendBulkEmail } from '@/utils/email';
import type { Database } from '@/types/database';
import { 
  EmailContact, 
  NewsletterStatus, 
  DraftStatus,
  NewsletterWithRelations,
  Newsletter,
  Company,
  NewsletterSection
} from '@/types/email';
import { APIError } from '@/utils/errors';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type NewsletterWithJoins = Newsletter & {
  company: Pick<Company, 'company_name' | 'industry' | 'target_audience' | 'audience_description' | 'contact_email'>;
  newsletter_sections: NewsletterSection[];
};

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { newsletterId } = await request.json();

    if (!newsletterId) {
      throw new APIError('Missing newsletterId', 400);
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
        company:companies!inner (
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
      .single() as unknown as { data: NewsletterWithJoins | null; error: any };

    if (newsletterError || !newsletter) {
      console.error('Newsletter error:', newsletterError);
      throw new APIError('Failed to fetch newsletter or newsletter not in pending draft status', 500);
    }

    if (!newsletter.draft_recipient_email) {
      throw new APIError('No draft recipient email found', 400);
    }

    // Transform the response to match NewsletterWithRelations type
    const typedNewsletter: NewsletterWithRelations = {
      id: newsletter.id,
      company_id: newsletter.company_id,
      subject: newsletter.subject,
      draft_status: newsletter.draft_status,
      draft_recipient_email: newsletter.draft_recipient_email,
      draft_sent_at: newsletter.draft_sent_at,
      status: newsletter.status,
      sent_at: newsletter.sent_at,
      sent_count: newsletter.sent_count,
      failed_count: newsletter.failed_count,
      last_sent_status: newsletter.last_sent_status,
      created_at: newsletter.created_at,
      updated_at: newsletter.updated_at,
      company: {
        company_name: newsletter.company.company_name,
        industry: newsletter.company.industry,
        target_audience: newsletter.company.target_audience,
        audience_description: newsletter.company.audience_description,
        contact_email: newsletter.company.contact_email
      },
      newsletter_sections: newsletter.newsletter_sections.map(section => ({
        newsletter_id: section.newsletter_id,
        section_number: section.section_number,
        title: section.title,
        content: section.content,
        image_prompt: section.image_prompt,
        image_url: section.image_url,
        status: section.status,
        created_at: null,
        updated_at: null
      }))
    };

    // Send draft to recipient
    const contact: EmailContact = {
      email: typedNewsletter.draft_recipient_email,
      name: null
    };

    const { success, error } = await sendBulkEmail(typedNewsletter, [contact]);

    if (!success) {
      throw new APIError(error?.message || 'Failed to send draft newsletter', 500);
    }

    // Update newsletter status
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({
        draft_status: 'sent' as DraftStatus,
        draft_sent_at: new Date().toISOString(),
        last_sent_status: success ? 'success' : 'failed'
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new APIError('Failed to update newsletter status', 500);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending draft newsletter:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
