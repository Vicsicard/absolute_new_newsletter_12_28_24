import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  try {
    // Get queue items for this newsletter
    const { data: queueItems, error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', id)
      .order('section_number', { ascending: true });

    if (queueError) {
      console.error('Error fetching queue status:', queueError);
      return NextResponse.json(
        { error: 'Failed to fetch generation status' },
        { status: 500 }
      );
    }

    // Get the newsletter sections that have been generated
    const { data: sections, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', id)
      .order('section_number', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch newsletter sections' },
        { status: 500 }
      );
    }

    // Calculate overall progress
    const totalSections = queueItems.length;
    const completedSections = queueItems.filter(item => item.status === 'completed').length;
    const failedSections = queueItems.filter(item => item.status === 'failed').length;
    const inProgressSections = queueItems.filter(item => item.status === 'in_progress').length;

    const progress = {
      total: totalSections,
      completed: completedSections,
      failed: failedSections,
      inProgress: inProgressSections,
      percentComplete: Math.round((completedSections / totalSections) * 100),
      sections: queueItems.map(item => ({
        type: item.section_type,
        status: item.status,
        attempts: item.attempts,
        error: item.error_message,
        content: sections.find(s => s.section_type === item.section_type)?.content || null,
        imageUrl: sections.find(s => s.section_type === item.section_type)?.image_url || null,
      }))
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter status' },
      { status: 500 }
    );
  }
}
