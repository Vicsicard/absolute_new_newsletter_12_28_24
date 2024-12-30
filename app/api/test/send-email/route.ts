import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/email';

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, htmlContent } = body;

    if (!to?.email) {
      return NextResponse.json(
        { error: 'Missing recipient email' },
        { status: 400 }
      );
    }

    const messageId = await sendEmail(to, subject, htmlContent);
    
    return NextResponse.json({ 
      success: true,
      messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
