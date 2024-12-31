import { NextRequest, NextResponse } from 'next/server';
import { generateNewsletter } from '@/utils/newsletter';
import { sendNewsletterDraft } from '@/utils/newsletter-draft';
import { DatabaseError, APIError } from '@/utils/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Generating newsletter for ID:', params.id);
    
    const sections = await generateNewsletter(params.id);
    
    console.log('Generated sections:', sections);

    // Now send the draft email directly without making an HTTP request
    console.log('Sending draft email...');
    try {
      const result = await sendNewsletterDraft(params.id);
      console.log('Draft sent successfully:', result);
    } catch (error) {
      console.error('Error sending draft:', error);
      // Continue even if draft sending fails - we don't want to fail the whole generation
      // The user can always retry sending the draft later
    }

    return NextResponse.json({
      success: true,
      sections
    });
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
