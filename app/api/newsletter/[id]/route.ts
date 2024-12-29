import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: newsletter, error } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        companies (
          company_name,
          industry,
          contact_email
        )
      `)
      .eq('id', params.id)
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
        { success: false, message: 'Newsletter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newsletter
    });
  } catch (error) {
    console.error('Error in newsletter route:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
