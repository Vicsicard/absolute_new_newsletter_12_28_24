import { NextRequest, NextResponse } from 'next/server';
import { generateNewsletter } from '@/utils/newsletter';
import { sendNewsletterDraft } from '@/utils/newsletter-draft';
import { DatabaseError, APIError } from '@/utils/errors';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { initializeGenerationQueue } from '@/utils/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Generating newsletter for ID:', params.id);
    
    // Get newsletter details including recipient email
    const supabase = getSupabaseAdmin();
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', params.id)
      .single();

    if (newsletterError || !newsletter) {
      return NextResponse.json(
        { success: false, message: 'Newsletter not found' },
        { status: 404 }
      );
    }

    if (!newsletter.draft_recipient_email) {
      return NextResponse.json(
        { success: false, message: 'No draft recipient email set for this newsletter' },
        { status: 400 }
      );
    }
    
    // Initialize the generation queue
    await initializeGenerationQueue(params.id, supabase);
    
    // Start generation process
    const sections = await generateNewsletter(params.id);
    
    console.log('Generated sections:', sections);

    // Send draft to the newsletter's draft_recipient_email
    console.log('Sending draft email to:', newsletter.draft_recipient_email);
    try {
      const result = await sendNewsletterDraft(params.id, newsletter.draft_recipient_email);
      console.log('Draft sent successfully:', result);
      
      return NextResponse.json({
        success: true,
        sections,
        draft: {
          sent: true,
          recipientEmail: newsletter.draft_recipient_email,
          result
        }
      });
    } catch (error) {
      console.error('Error sending draft:', error);
      return NextResponse.json({
        success: true,
        sections,
        draft: {
          sent: false,
          error: error instanceof Error ? error.message : 'Failed to send draft'
        }
      });
    }
  } catch (error) {
    console.error('Error generating newsletter:', error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to generate newsletter' },
      { status: 500 }
    );
  }
}
