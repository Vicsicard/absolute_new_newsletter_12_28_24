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
