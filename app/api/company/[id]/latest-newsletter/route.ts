import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { NewsletterSection } from '@/types/email';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const companyId = params.id;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get the latest newsletter for this company
    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        sections:newsletter_sections(
          id,
          section_number,
          title,
          content,
          image_url,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching newsletter:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    if (!newsletter) {
      return NextResponse.json(
        { success: false, message: 'No newsletter found' },
        { status: 404 }
      );
    }

    // Sort sections by section_number if they exist
    if (newsletter.sections) {
      newsletter.sections.sort((a: NewsletterSection, b: NewsletterSection) => 
        a.section_number - b.section_number
      );
    }

    return NextResponse.json({
      success: true,
      data: newsletter
    });
  } catch (error) {
    console.error('Error in latest-newsletter route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
