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
      console.error('Newsletter not found:', newsletterError);
      return NextResponse.json(
        { success: false },
        { status: 404 }
      );
    }

    if (!newsletter.draft_recipient_email) {
      console.error('No draft recipient email set');
      return NextResponse.json(
        { success: false },
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
      await sendNewsletterDraft(newsletter.id, newsletter.draft_recipient_email);
      
      return NextResponse.json({
        success: true,
        message: 'Newsletter generation started'
      });
    } catch (error) {
      console.error('Error sending draft:', error);
      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating newsletter:', error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
