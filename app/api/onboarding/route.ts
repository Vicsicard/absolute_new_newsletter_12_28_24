import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';
import { parseCSV } from '@/utils/csv';
import type { OnboardingResponse, Company } from '@/types';
import { ApiError, DatabaseError } from '@/utils/errors';
import { NextRequest } from 'next/server';

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

    // Extract company data from FormData - including the new fields
    const companyData = {
      company_name: formData.get('company_name') as string,
      industry: formData.get('industry') as string,
      contact_email: formData.get('contact_email') as string,
      website_url: formData.get('website_url') as string,
      phone_number: formData.get('phone_number') as string,
      target_audience: formData.get('target_audience') as string || 'General Audience',
      audience_description: formData.get('audience_description') as string,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store newsletter-specific metadata
    const newsletterMetadata = {
      newsletter_objectives: formData.get('newsletter_objectives') as string,
      primary_cta: formData.get('primary_cta') as string,
    };

    // Insert company data
    console.log('Inserting company data:', companyData);
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
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .insert([{
        company_id: company.id,
        title: `${companyData.company_name}'s Industry Newsletter`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        newsletter_objectives: newsletterMetadata.newsletter_objectives,
        primary_cta: newsletterMetadata.primary_cta,
        industry_summary: '',  // Will be filled by AI later
        section1_content: '',  // Will be filled by AI later
        section2_content: '',  // Will be filled by AI later
        section3_content: ''   // Will be filled by AI later
      }])
      .select()
      .single();

    if (newsletterError) {
      console.error('Newsletter creation error:', newsletterError);
      throw new DatabaseError(`Failed to create newsletter: ${newsletterError.message}`);
    }

    // Process contact list if provided
    const contactListFile = formData.get('contact_list') as File;
    let totalContacts = 0;

    if (contactListFile && contactListFile.size > 0) {
      try {
        console.log('Processing contact list file...');
        const fileContent = await contactListFile.text();
        console.log('CSV content:', fileContent);
        
        const contacts = await parseCSV(fileContent);
        console.log('Parsed contacts:', contacts);

        if (!company?.id) {
          console.error('Company ID is missing');
          throw new DatabaseError('Failed to process contacts: Company ID is missing');
        }

        // Add company_id to each contact
        const contactsWithCompanyId = contacts.map(contact => ({
          ...contact,
          company_id: company.id,
        }));

        // Insert contacts in batches and collect their IDs
        if (contactsWithCompanyId.length > 0) {
          console.log(`Inserting ${contactsWithCompanyId.length} contacts...`);
          
          const { data: insertedContacts, error: contactsError } = await supabaseAdmin
            .from('contacts')
            .insert(contactsWithCompanyId)
            .select('id');

          if (contactsError) {
            console.error('Contacts insertion error:', contactsError);
            throw new DatabaseError(`Failed to insert contacts: ${contactsError.message}`);
          }

          // Create newsletter_contacts entries
          if (insertedContacts && insertedContacts.length > 0) {
            const newsletterContacts = insertedContacts.map(contact => ({
              newsletter_id: newsletter.id,
              contact_id: contact.id,
              created_at: new Date().toISOString()
            }));

            const { error: newsletterContactsError } = await supabaseAdmin
              .from('newsletter_contacts')
              .insert(newsletterContacts);

            if (newsletterContactsError) {
              console.error('Newsletter contacts insertion error:', newsletterContactsError);
              throw new DatabaseError(`Failed to link contacts to newsletter: ${newsletterContactsError.message}`);
            }
          }

          console.log('Contacts and newsletter_contacts inserted successfully');
          totalContacts = contactsWithCompanyId.length;
        }
      } catch (error) {
        console.error('Error processing contacts:', error);
        throw new Error(`Failed to process contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return success response with company and newsletter IDs
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        company_id: company.id,
        newsletter_id: newsletter.id,
        total_contacts: totalContacts
      }
    });
  } catch (error) {
    console.error('Detailed error in onboarding process:', {
      error,
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    const apiError = error instanceof ApiError ? error : new DatabaseError('Internal server error');
    
    return NextResponse.json(
      {
        success: false,
        message: apiError.message,
        error: {
          type: apiError.name,
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: apiError.statusCode || 500 }
    );
  }
}
