import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';
import type { Newsletter, NewsletterContact, Contact } from '@/types/email';

interface NewsletterContactWithRelations extends NewsletterContact {
  contacts: Contact;
}

interface NewsletterWithRelations extends Newsletter {
  companies: {
    company_name: string;
    industry: string;
    contact_email: string;
    target_audience: string | null;
    audience_description: string | null;
  };
  newsletter_sections: Array<{
    id: string;
    section_number: number;
    title: string;
    content: string;
    image_prompt: string | null;
    image_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  newsletter_contacts: NewsletterContactWithRelations[];
}

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    if (!params.id) {
      throw new APIError('Newsletter ID is required', 400);
    }

    // Get newsletter with all related data
    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        companies (
          company_name,
          industry,
          contact_email,
          target_audience,
          audience_description
        ),
        newsletter_sections (
          id,
          section_number,
          title,
          content,
          image_prompt,
          image_url,
          status,
          created_at,
          updated_at
        ),
        newsletter_contacts (
          id,
          contact_id,
          status,
          sent_at,
          error_message,
          created_at,
          updated_at,
          contacts (
            id,
            email,
            name,
            status
          )
        )
      `)
      .eq('id', params.id)
      .order('section_number', { foreignTable: 'newsletter_sections' })
      .single();

    if (error) {
      console.error('Error fetching newsletter:', error);
      throw new APIError(error.message, 500);
    }

    if (!newsletter) {
      throw new APIError('Newsletter not found', 404);
    }

    // Filter out inactive contacts and format response
    const formattedNewsletter = {
      ...newsletter,
      newsletter_contacts: (newsletter as NewsletterWithRelations).newsletter_contacts?.filter(
        contact => contact.contacts?.status === 'active'
      )
    };

    return NextResponse.json({
      success: true,
      data: formattedNewsletter
    });

  } catch (error) {
    console.error('Error in newsletter route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof APIError ? error.status : 500 }
    );
  }
}
