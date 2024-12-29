import { NextResponse } from 'next/server';
import { generateNewsletter } from '@/utils/newsletter';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface GenerateRequest {
  newsletterId: string;
  prompt?: string;
  sections?: {
    title: string;
    content: string;
    image_prompt?: string;
  }[];
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const body = await req.json() as GenerateRequest;
    const { newsletterId, prompt, sections } = body;

    if (!newsletterId) {
      throw new APIError('Missing newsletter ID', 400);
    }

    // Verify newsletter exists and belongs to company
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        companies (
          company_name,
          industry,
          target_audience,
          audience_description
        )
      `)
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to fetch newsletter', 500);
    }

    // If sections are provided, use those instead of generating new ones
    let generatedSections;
    if (sections) {
      generatedSections = sections;
    } else {
      // Generate sections using OpenAI
      generatedSections = await generateNewsletter(
        newsletterId,
        prompt,
        {
          companyName: newsletter.companies.company_name,
          industry: newsletter.companies.industry,
          targetAudience: newsletter.companies.target_audience,
          audienceDescription: newsletter.companies.audience_description
        }
      );
    }

    // Update newsletter sections
    const { error: updateError } = await supabaseAdmin
      .from('newsletter_sections')
      .upsert(
        generatedSections.map((section, index) => ({
          newsletter_id: newsletterId,
          section_number: index + 1,
          title: section.title,
          content: section.content,
          image_prompt: section.image_prompt || null,
          image_url: null, // Reset image URL since we're generating new content
          status: 'active'
        }))
      );

    if (updateError) {
      throw new APIError('Failed to update newsletter sections', 500);
    }

    return NextResponse.json({
      success: true,
      data: {
        sections: generatedSections
      }
    });
  } catch (error) {
    console.error('Error generating newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof APIError ? error.statusCode : 500 }
    );
  }
}
