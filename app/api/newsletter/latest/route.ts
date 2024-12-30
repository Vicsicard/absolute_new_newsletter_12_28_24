import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';

export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    // Get the latest newsletter
    const { data: latestNewsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (newsletterError) {
      console.error('Error fetching latest newsletter:', newsletterError);
      return NextResponse.json(
        { error: 'Failed to fetch latest newsletter' },
        { status: 500 }
      );
    }

    // Get queue items for this newsletter
    const { data: queueItems, error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', latestNewsletter.id)
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
      .eq('newsletter_id', latestNewsletter.id)
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

    return NextResponse.json({
      id: latestNewsletter.id,
      progress: {
        total: totalSections,
        completed: completedSections,
        failed: failedSections,
        inProgress: inProgressSections,
        percentage: totalSections > 0 ? (completedSections / totalSections) * 100 : 0
      },
      queueItems,
      sections
    });
  } catch (error) {
    console.error('Error in latest newsletter status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter status' },
      { status: 500 }
    );
  }
}
