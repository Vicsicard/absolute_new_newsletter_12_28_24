import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { generateNewsletter, sendNewsletter } from '@/utils/newsletter';
import type { OnboardingResponse } from '@/types/api';
import { APIError as ApiError, DatabaseError } from '@/utils/errors';
import { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

// New way to configure API routes in App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function POST(req: NextRequest) {
  try {
    console.log('API: Received onboarding request');
    
    // Get form data
    const formData = await req.formData();
    console.log('API: Form data received:', Object.fromEntries(formData.entries()));

    // Validate required fields
    const requiredFields = ['company_name', 'industry', 'contact_email'];
    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value) {
        console.error(`API: Missing required field: ${field}`);
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Extract company data from FormData
    const companyData = {
      company_name: formData.get('company_name') as string,
      industry: formData.get('industry') as string,
      contact_email: formData.get('contact_email') as string,
      website_url: (formData.get('website_url') as string) || null,
      phone_number: (formData.get('phone_number') as string) || null,
      target_audience: (formData.get('target_audience') as string) || null,
      audience_description: (formData.get('audience_description') as string) || null,
    };

    console.log('API: Prepared company data:', companyData);

    // Insert company data
    const { data: company, error: insertError } = await supabaseAdmin
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (insertError) {
      console.error('API: Company insertion error:', insertError);
      throw new DatabaseError('Failed to create company');
    }

    console.log('API: Company created successfully:', company);

    // Insert newsletter data with all fields from the schema
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .insert({
        company_id: company.id,
        subject: `${companyData.company_name} - Welcome Newsletter`,
        draft_status: 'pending',
        draft_recipient_email: companyData.contact_email
      })
      .select()
      .single();

    if (newsletterError) {
      console.error('API: Failed to create newsletter:', newsletterError);
      throw new DatabaseError('Failed to create newsletter');
    }

    console.log('API: Newsletter created successfully:', newsletter);

    // Generate and insert newsletter sections
    console.log('API: Generating newsletter sections...');
    const sections = await generateNewsletter(newsletter.id);
    console.log('API: Newsletter sections generated:', sections);

    // Insert newsletter sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const { data: insertedSection, error: sectionError } = await supabaseAdmin
        .from('newsletter_sections')
        .insert({
          newsletter_id: newsletter.id,
          section_number: i + 1,
          title: section.title,
          content: section.content,
          image_prompt: section.image_prompt || null,
          image_url: section.image_url || null
        })
        .select()
        .single();

      if (sectionError) {
        console.error(`API: Failed to insert section ${i + 1}:`, sectionError);
        continue;
      }

      // Record image generation if it exists
      if (section.image_prompt) {
        const { error: imageHistoryError } = await supabaseAdmin
          .from('image_generation_history')
          .insert({
            newsletter_section_id: insertedSection.id,
            prompt: section.image_prompt,
            status: section.image_url ? 'completed' : 'failed',
            image_url: section.image_url || null
          });

        if (imageHistoryError) {
          console.error('API: Failed to record image generation:', imageHistoryError);
        }
      }
    }

    // Wait a bit to ensure all database operations are complete
    console.log('API: Waiting for all processes to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

    // Double check that all sections and images are properly saved
    const { data: savedSections, error: fetchError } = await supabaseAdmin
      .from('newsletter_sections')
      .select('*, image_generation_history(*)')
      .eq('newsletter_id', newsletter.id)
      .order('section_number');

    if (fetchError) {
      console.error('API: Failed to fetch saved sections:', fetchError);
      throw new DatabaseError('Failed to verify newsletter sections');
    }

    // Verify all sections are present and images are generated
    if (!savedSections || savedSections.length !== sections.length) {
      console.error('API: Missing sections:', { expected: sections.length, found: savedSections?.length });
      throw new Error('Newsletter sections are incomplete');
    }

    // Format the newsletter content with verified saved sections
    const formattedContent = savedSections.map((section) => `
      <div class="newsletter-section">
        <h2>${section.title}</h2>
        ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}" style="max-width: 100%; height: auto; margin: 20px 0;">` : ''}
        <div class="content">
          ${section.content.split('\n').map((line: string) => `<p>${line}</p>`).join('\n')}
        </div>
      </div>
    `).join('\n\n');

    // Send draft email with the verified content
    const emailContact = {
      email: companyData.contact_email,
      name: companyData.company_name
    };

    console.log('API: Sending draft email to:', emailContact);
    
    await sendNewsletter(
      [emailContact],
      `${companyData.company_name} - Welcome Newsletter Draft`,
      formattedContent
    );
    
    console.log('API: Newsletter draft sent successfully');

    // Update newsletter status to draft_sent
    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update({ 
        draft_status: 'draft_sent',
        draft_sent_at: new Date().toISOString()
      })
      .eq('id', newsletter.id);

    if (updateError) {
      console.error('API: Failed to update newsletter status:', updateError);
      throw new DatabaseError('Failed to update newsletter status');
    }

    console.log('API: Newsletter status updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Newsletter draft created and sent successfully',
      data: { newsletter_id: newsletter.id }
    });

  } catch (error) {
    console.error('API: Onboarding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process onboarding' 
      },
      { status: 500 }
    );
  }
}
