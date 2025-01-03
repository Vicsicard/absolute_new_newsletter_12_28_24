import { sendEmail, validateEmail } from '@/utils/email';
import { generateEmailHTML } from '@/utils/email-template';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { 
  NewsletterWithAll,
  NewsletterSectionStatus,
  DraftStatus,
  NewsletterStatus 
} from '@/types/email';
import { APIError } from '@/utils/errors';

interface SendNewsletterDraftResult {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    sent_at: string;
  };
}

/**
 * Send a draft of a newsletter to the specified recipient
 * This function handles all the logic for sending a draft, including:
 * - Fetching the newsletter data
 * - Generating the HTML content
 * - Sending the email
 * - Updating the newsletter status
 */
export async function sendNewsletterDraft(newsletterId: string, recipientEmail?: string): Promise<SendNewsletterDraftResult> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
      throw new APIError('Missing required Brevo environment variables', 500);
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

    // Use provided recipient email or fallback to draft_recipient_email
    const targetEmail = recipientEmail || newsletter.draft_recipient_email;
    if (!targetEmail) {
      throw new APIError('Draft recipient email is required', 400);
    }

    // Validate email format
    if (!validateEmail(targetEmail)) {
      throw new APIError(`Invalid draft recipient email format: ${targetEmail}`, 400);
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
    console.log('Sending draft to:', targetEmail);
    const result = await sendEmail(
      {
        email: targetEmail,
        name: null // Match database schema where name is optional
      },
      typedNewsletter.subject,
      htmlContent
    );

    console.log('Email sending result:', result);

    // Update newsletter status based on database constraints
    const updates = {
      draft_status: 'sent' as DraftStatus,
      draft_sent_at: result.sent_at,
      last_sent_status: 'success',
      // Status should be 'draft' or 'ready_to_send' based on database constraints
      status: 'ready_to_send' as NewsletterStatus,
      updated_at: new Date().toISOString()
    };

    console.log('Updating newsletter status:', updates);
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updates)
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
      throw new APIError('Failed to update newsletter status', 500);
    }

    return {
      success: true,
      message: 'Draft sent successfully',
      data: result
    };

  } catch (error) {
    console.error('Error sending draft:', error);
    
    // Update newsletter status to error state
    try {
      await supabaseAdmin
        .from('newsletters')
        .update({
          draft_status: 'failed' as DraftStatus,
          status: 'error' as NewsletterStatus,
          last_sent_status: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', newsletterId);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Internal server error', 500);
  }
}
