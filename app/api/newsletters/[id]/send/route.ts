import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { sendFinalNewsletter } from '@/utils/email';
import { APIError } from '@/utils/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const newsletterId = params.id;

    // Verify newsletter exists and is in correct state
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select('draft_status, status')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Newsletter not found', 404);
    }

    // Verify newsletter is ready to send
    if (newsletter.draft_status !== 'ready_to_send') {
      throw new APIError(
        `Newsletter is not ready to send. Current status: ${newsletter.draft_status}`,
        400
      );
    }

    if (newsletter.status !== 'draft') {
      throw new APIError(
        `Newsletter has already been published. Status: ${newsletter.status}`,
        400
      );
    }

    // Send the newsletter
    const result = await sendFinalNewsletter(newsletterId);

    return NextResponse.json({
      message: 'Newsletter sending process initiated',
      result
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);

    // Log the error
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('api_error_logs').insert({
      endpoint: `/api/newsletters/${params.id}/send`,
      method: 'POST',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_code: error instanceof APIError ? error.statusCode.toString() : '500',
      stack_trace: error instanceof Error ? error.stack : undefined,
      metadata: {
        newsletter_id: params.id
      }
    });

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
