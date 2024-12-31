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
    
    // Get recipient email from request body
    const body = await request.json();
    const recipientEmail = body.recipientEmail;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, message: 'Recipient email is required' },
        { status: 400 }
      );
    }
    
    const sections = await generateNewsletter(params.id);
    
    console.log('Generated sections:', sections);

    // Now send the draft email with the provided recipient email
    console.log('Sending draft email to:', recipientEmail);
    try {
      const result = await sendNewsletterDraft(params.id, recipientEmail);
      console.log('Draft sent successfully:', result);
      
      return NextResponse.json({
        success: true,
        sections,
        draft: {
          sent: true,
          recipientEmail,
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
