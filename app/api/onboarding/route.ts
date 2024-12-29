import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { generateNewsletter, sendNewsletter } from '@/utils/newsletter';
import type { OnboardingResponse } from '@/types/api';
import { APIError as ApiError, DatabaseError } from '@/utils/errors';
import { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
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
        console.error('API: Failed to insert section:', sectionError);
        throw new DatabaseError('Failed to create newsletter section');
      }
    }

    // Send the welcome email
    try {
      const welcomeEmail = {
        email: companyData.contact_email,
        name: companyData.company_name
      };

      const welcomeSubject = `Welcome to Our Newsletter Service - ${companyData.company_name}`;
      const welcomeContent = `
        <h1>Welcome to Our Newsletter Service!</h1>
        <p>Dear ${companyData.company_name},</p>
        <p>Thank you for signing up for our newsletter service. We're excited to help you create engaging newsletters for your audience.</p>
        <p>We've generated your first draft newsletter and will send it to you shortly for review.</p>
        <p>Best regards,<br>Your Newsletter Team</p>
      `;

      await sendNewsletter(
        newsletter.id,
        [welcomeEmail],
        welcomeSubject,
        welcomeContent
      );

      console.log('API: Welcome email sent successfully');
    } catch (emailError) {
      console.error('API: Failed to send welcome email:', emailError);
      // Don't throw error here, as we still want to return success response
    }

    return NextResponse.json({
      success: true,
      data: {
        company,
        newsletter
      }
    });
  } catch (error) {
    console.error('API: Error in onboarding route:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: statusCode }
    );
  }
}
