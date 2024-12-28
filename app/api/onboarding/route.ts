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
    // Get form data
    const formData = await req.formData();
    
    // Log the start of processing
    console.log('Starting onboarding process...');
    console.log('Form data received:', Object.fromEntries(formData.entries()));

    // Validate required fields
    const requiredFields = ['company_name', 'industry', 'contact_email'];
    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value) {
        console.error(`Missing required field: ${field}`);
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

    console.log('Prepared company data:', companyData);

    // Insert company data
    const { data: company, error: insertError } = await supabaseAdmin
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (insertError) {
      console.error('Company insertion error:', insertError);
      throw new DatabaseError(`Failed to insert company data: ${insertError.message}`);
    }

    console.log('Company inserted successfully:', company);

    // Create a new newsletter entry
    const newsletterData = {
      company_id: company.id,
      title: `${companyData.company_name}'s Industry Newsletter`,
      status: 'draft',
      draft_status: 'pending',
      draft_recipient_email: companyData.contact_email,
    };

    console.log('Creating newsletter with data:', newsletterData);

    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .insert([newsletterData])
      .select()
      .single();

    if (newsletterError) {
      console.error('Newsletter creation error:', newsletterError);
      throw new DatabaseError(`Failed to create newsletter: ${newsletterError.message}`);
    }

    // Generate newsletter content
    console.log('Generating newsletter content...');
    try {
      const sections = await generateNewsletter(newsletter.id);
      console.log('Newsletter sections generated:', sections);

      // Insert sections into newsletter_sections table
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionData = {
          newsletter_id: newsletter.id,
          section_number: i + 1,  // Ensures proper ordering per newsletter_sections_newsletter_id_section_number_key
          title: section.title,
          content: section.content,
          image_prompt: section.imagePrompt || null,
          image_url: section.imageUrl || null,
          status: 'active'
        };

        const { data: insertedSection, error: sectionError } = await supabaseAdmin
          .from('newsletter_sections')
          .insert([sectionData])
          .select()
          .single();

        if (sectionError) {
          console.error(`Failed to insert section ${i + 1}:`, sectionError);
          continue;
        }

        // If image was generated, record it in image_generation_history
        if (section.imageUrl && section.imagePrompt) {
          const { error: imageHistoryError } = await supabaseAdmin
            .from('image_generation_history')
            .insert([{
              newsletter_section_id: insertedSection.id,
              prompt: section.imagePrompt,
              image_url: section.imageUrl,
              status: 'completed'
            }]);

          if (imageHistoryError) {
            console.error('Failed to record image generation:', imageHistoryError);
          }
        }

        // Update the section object with the database ID
        section.id = insertedSection.id;
      }

      // Format newsletter for email
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; text-align: center; margin-bottom: 30px;">${newsletterData.title}</h1>
          <p style="color: #4a5568; margin-bottom: 30px; text-align: center; font-size: 1.1em;">
            A custom industry newsletter crafted for ${company.company_name}
          </p>
          
          ${sections.map((section, index) => {
            // Parse the content into structured parts
            const contentParts = section.content.split('\n\n').filter(Boolean);
            const headline = contentParts[0]?.replace('Headline:', '').trim();
            const introduction = contentParts[1]?.replace('Introduction:', '').trim();
            const whyItMatters = contentParts[2]?.replace('Why It Matters:', '').trim().split('\n');
            const solution = contentParts[3]?.replace('The Solution:', '').trim();
            const takeaway = contentParts[4]?.replace('The Takeaway:', '').trim();

            return `
              <div style="margin-bottom: 60px; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #2b6cb0; margin-bottom: 20px; font-size: 1.8em;">${section.title}</h2>
                
                ${headline ? `<h3 style="color: #2d3748; margin-bottom: 16px; font-size: 1.4em;">${headline}</h3>` : ''}
                
                ${introduction ? `
                  <div style="color: #4a5568; line-height: 1.8; margin-bottom: 24px; font-size: 1.1em;">
                    ${introduction}
                  </div>
                ` : ''}
                
                ${whyItMatters ? `
                  <div style="margin: 24px 0;">
                    <h4 style="color: #2d3748; margin-bottom: 16px;">Why It Matters:</h4>
                    <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                      ${whyItMatters.map(point => `
                        <li style="margin-bottom: 8px;">${point.trim().replace('- ', '')}</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${solution ? `
                  <div style="margin: 24px 0;">
                    <h4 style="color: #2d3748; margin-bottom: 16px;">The Solution:</h4>
                    <div style="color: #4a5568; line-height: 1.7;">
                      ${solution}
                    </div>
                  </div>
                ` : ''}

                ${section.imageUrl ? `
                  <div style="margin: 32px 0; text-align: center;">
                    <img src="${section.imageUrl}" 
                         alt="${section.title}" 
                         style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <p style="color: #718096; font-size: 0.9em; margin-top: 8px; font-style: italic;">
                      Generated image based on section theme
                    </p>
                  </div>
                ` : ''}
                
                ${takeaway ? `
                  <div style="margin-top: 24px; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
                    <h4 style="color: #2d3748; margin-bottom: 12px;">Key Takeaway:</h4>
                    <div style="color: #4a5568; line-height: 1.7;">
                      ${takeaway}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('\n')}

          <div style="margin-top: 40px; padding: 24px; border-top: 2px solid #e2e8f0; background-color: #f7fafc; border-radius: 8px;">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Next Steps:</h3>
            <ol style="color: #4a5568; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Review the content and generated images above</li>
              <li style="margin-bottom: 8px;">Prepare your contact list in CSV format</li>
              <li style="margin-bottom: 8px;">Reply to this email with any requested changes</li>
            </ol>
            <p style="color: #718096; font-size: 0.875rem; margin-top: 16px;">
              Note: Each section includes an AI-generated image based on the content theme. If you'd like different images, let us know in your reply.
            </p>
          </div>
        </div>
      `;

      // Send draft newsletter via email
      await sendNewsletter(
        [{ email: companyData.contact_email }],
        `[DRAFT] ${newsletterData.title}`,
        htmlContent
      );

      // Update newsletter status
      const { error: updateError } = await supabaseAdmin
        .from('newsletters')
        .update({ 
          status: 'draft_sent',
          draft_status: 'sent',
          draft_sent_at: new Date().toISOString()
        })
        .eq('id', newsletter.id);

      if (updateError) {
        console.error('Failed to update newsletter status:', updateError);
      }

      console.log('Newsletter draft sent successfully');

    } catch (error) {
      console.error('Failed in newsletter process:', error);
      // Update status to failed
      await supabaseAdmin
        .from('newsletters')
        .update({ 
          draft_status: 'failed',
          status: 'draft'
        })
        .eq('id', newsletter.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        company_id: company.id,
        newsletter_id: newsletter.id,
      }
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process onboarding' 
      },
      { status: 500 }
    );
  }
}
