import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { OnboardingResponse } from '@/types/api';
import { APIError } from '@/utils/errors';
import { NextRequest } from 'next/server';
import type { 
  Company,
  Contact,
  Newsletter,
  NewsletterContact,
  NewsletterStatus,
  ContactStatus,
  NewsletterContactStatus
} from '@/types/email';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Get form data
    const formData = await req.formData();

    // Validate required fields
    const requiredFields = ['company_name', 'industry', 'contact_email'];
    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value) {
        throw new APIError(`Missing required field: ${field}`, 400);
      }
    }

    // Extract company data from FormData
    const companyData: Partial<Company> = {
      company_name: formData.get('company_name') as string,
      industry: formData.get('industry') as string,
      contact_email: formData.get('contact_email') as string,
      target_audience: formData.get('target_audience') as string || null,
      audience_description: formData.get('audience_description') as string || null,
      website_url: formData.get('website_url') as string || null,
      phone_number: formData.get('phone_number') as string || null
    };

    // Start a transaction
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (companyError || !company) {
      throw new APIError('Failed to create company', 500);
    }

    // Process contacts CSV if provided
    const contactsFile = formData.get('contacts') as File;
    let contacts: Contact[] = [];

    if (contactsFile) {
      const fileContent = await contactsFile.text();
      const rows = fileContent
        .split('\n')
        .slice(1) // Skip header row
        .filter(row => row.trim()) // Remove empty rows
        .map(row => {
          const [email, name] = row.split(',').map(field => field.trim());
          return {
            company_id: company.id,
            email,
            name: name || null,
            status: 'active' as ContactStatus
          };
        });

      // Validate emails and insert contacts
      const validContacts = rows.filter(contact => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(contact.email);
      });

      if (validContacts.length > 0) {
        const { data: insertedContacts, error: contactsError } = await supabaseAdmin
          .from('contacts')
          .insert(validContacts)
          .select();

        if (contactsError) {
          throw new APIError('Failed to create contacts', 500);
        }

        contacts = insertedContacts;
      }
    }

    // Create initial newsletter
    const newsletterData: Partial<Newsletter> = {
      company_id: company.id,
      subject: `${company.company_name} Newsletter`,
      status: 'draft' as NewsletterStatus,
      draft_status: 'pending',
      draft_recipient_email: company.contact_email,
      sent_count: 0,
      failed_count: 0
    };

    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .insert(newsletterData)
      .select()
      .single();

    if (newsletterError || !newsletter) {
      throw new APIError('Failed to create newsletter', 500);
    }

    // Create newsletter contacts entries
    if (contacts.length > 0) {
      const newsletterContacts: Partial<NewsletterContact>[] = contacts.map(contact => ({
        newsletter_id: newsletter.id,
        contact_id: contact.id!,
        status: 'pending' as NewsletterContactStatus
      }));

      const { error: newsletterContactsError } = await supabaseAdmin
        .from('newsletter_contacts')
        .insert(newsletterContacts);

      if (newsletterContactsError) {
        throw new APIError('Failed to create newsletter contacts', 500);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Company onboarded successfully',
      data: {
        company_id: company.id,
        newsletter_id: newsletter.id,
        total_contacts: contacts.length
      }
    } as OnboardingResponse);

  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to onboard company'
      },
      { status: error instanceof APIError ? error.status : 500 }
    );
  }
}
