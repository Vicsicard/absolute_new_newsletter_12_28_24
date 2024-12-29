import { NextRequest, NextResponse } from 'next/server';
import { generateNewsletter } from '@/utils/newsletter';
import { DatabaseError } from '@/utils/errors';

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

    // Now send the draft email
    console.log('Sending draft email...');
    const baseUrl = process.env.BASE_URL || process.env.VERCEL_URL || request.headers.get('host');
    if (!baseUrl) {
      console.error('No base URL available');
      throw new Error('No base URL available');
    }

    const protocol = 'https';
    const apiUrl = baseUrl.startsWith('http') ? baseUrl : `${protocol}://${baseUrl}`;

    console.log('Sending draft with:', {
      baseUrl,
      apiUrl,
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasBrevoSender: !!process.env.BREVO_SENDER_EMAIL
    });

    const sendDraftUrl = `${apiUrl}/api/newsletter/send-draft`;
    try {
      const sendDraftResponse = await fetch(sendDraftUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsletterId: params.id
        })
      });

      const responseText = await sendDraftResponse.text();
      console.log('Send draft response:', {
        url: sendDraftUrl,
        status: sendDraftResponse.status,
        statusText: sendDraftResponse.statusText,
        headers: Object.fromEntries(sendDraftResponse.headers.entries()),
        body: responseText
      });

      if (!sendDraftResponse.ok) {
        console.error('Failed to send draft:', {
          url: sendDraftUrl,
          status: sendDraftResponse.status,
          statusText: sendDraftResponse.statusText,
          error: responseText
        });
      } else {
        try {
          const sendResult = JSON.parse(responseText);
          console.log('Draft sent successfully:', sendResult);
        } catch (parseError) {
          console.error('Error parsing send draft response:', parseError);
        }
      }
    } catch (error) {
      console.error('Error calling send-draft endpoint:', {
        url: sendDraftUrl,
        error
      });
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
