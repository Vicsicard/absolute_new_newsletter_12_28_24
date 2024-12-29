import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';
import type { Contact, NewsletterContact, NewsletterContactStatus } from '@/types/email';
import { NextRequest } from 'next/server';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { email, name } = await request.json();
    const newsletterId = params.id;

    if (!newsletterId || !email) {
      throw new APIError('Missing required fields: newsletter ID and email are required', 400);
    }

    // Get newsletter to get company_id
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select('company_id')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Newsletter not found', 404);
    }

    // Create or get contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .upsert({
        company_id: newsletter.company_id,
        email,
        name,
        status: 'active'
      })
      .select()
      .single();

    if (contactError) {
      throw new APIError('Failed to create/update contact', 500);
    }

    // Create newsletter contact
    const { data: newsletterContact, error: newsletterContactError } = await supabaseAdmin
      .from('newsletter_contacts')
      .upsert({
        newsletter_id: newsletterId,
        contact_id: contact.id,
        status: 'pending' as NewsletterContactStatus
      })
      .select(`
        *,
        contact:contacts (*)
      `)
      .single();

    if (newsletterContactError) {
      throw new APIError('Failed to create newsletter contact', 500);
    }

    return NextResponse.json({
      success: true,
      data: newsletterContact
    });

  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
