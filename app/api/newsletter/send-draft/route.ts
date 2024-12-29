import { NextResponse } from 'next/server';
import { sendBulkEmails, validateEmail } from '@/utils/email';
import { generateEmailHTML } from '@/utils/email-template';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { 
  Newsletter,
  NewsletterWithAll,
  NewsletterSectionStatus,
  DraftStatus,
  NewsletterStatus 
} from '@/types/email';
import { APIError } from '@/utils/errors';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
  throw new Error('Missing required Brevo environment variables');
}

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const { newsletterId } = await request.json();

    if (!newsletterId) {
      throw new APIError('Newsletter ID is required', 400);
    }

    console.log('Fetching newsletter data for ID:', newsletterId);
    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
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
      .eq('newsletter_sections.status', 'active' as NewsletterSectionStatus)
      .single();

    if (error) {
      console.error('Error fetching newsletter:', error);
      throw new APIError('Failed to fetch newsletter data', 500);
    }

    if (!newsletter) {
      throw new APIError('Newsletter not found', 404);
    }

    if (!newsletter.draft_recipient_email) {
      throw new APIError('Draft recipient email is required', 400);
    }

    // Validate email format
    if (!validateEmail(newsletter.draft_recipient_email)) {
      throw new APIError(`Invalid draft recipient email format: ${newsletter.draft_recipient_email}`, 400);
    }

    // Transform the response to match NewsletterWithAll type
    const typedNewsletter: NewsletterWithAll = {
      ...newsletter,
      company: newsletter.company,
      newsletter_sections: newsletter.newsletter_sections.sort((a: { section_number: number }, b: { section_number: number }) => a.section_number - b.section_number)
    };

    console.log('Generating newsletter HTML...');
    const htmlContent = generateEmailHTML({
      subject: typedNewsletter.subject,
      sections: typedNewsletter.newsletter_sections.map(section => ({
        title: section.title,
        content: section.content,
        imageUrl: section.image_url || undefined
      }))
    });

    // Send draft to test recipient
    console.log('Sending draft to:', typedNewsletter.draft_recipient_email);
    let result;
    try {
      result = await sendBulkEmails(
        [{
          email: typedNewsletter.draft_recipient_email!, // We've already checked it's not null above
          name: null // Match database schema where name is optional
        }],
        typedNewsletter.subject,
        htmlContent
      );
      console.log('Email sending result:', result);
    } catch (error) {
      console.error('Failed to send draft email:', error);
      throw new APIError('Failed to send draft email', 500);
    }

    // Update newsletter status based on send result
    const hasErrors = result.failed.length > 0;
    const updateData: Pick<Newsletter, 'draft_status' | 'draft_sent_at' | 'last_sent_status' | 'status'> = {
      draft_status: hasErrors ? 'failed' : 'sent' as DraftStatus,
      draft_sent_at: hasErrors ? null : new Date().toISOString(),
      last_sent_status: hasErrors ? `Error: ${result.failed[0]?.error_message || 'Unknown error'}` : 'success',
      status: hasErrors ? 'draft' : 'draft_sent' as NewsletterStatus
    };

    console.log('Updating newsletter status:', updateData);
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updateData)
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
      throw new APIError('Failed to update newsletter status', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Draft sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Error sending draft:', error);
    if (error instanceof APIError) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: error.statusCode });
    }
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
