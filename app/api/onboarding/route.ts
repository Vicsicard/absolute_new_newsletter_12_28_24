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
  NewsletterContactStatus,
  DraftStatus
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

    // Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (companyError || !company) {
      throw new APIError('Failed to create company', 500);
    }

    // Parse and validate contacts
    const contactsData = formData.get('contacts');
    let contacts: Array<Partial<Contact>> = [];
    if (contactsData) {
      try {
        const parsedContacts = JSON.parse(contactsData as string);
        if (Array.isArray(parsedContacts)) {
          contacts = parsedContacts.map(contact => ({
            company_id: company.id,
            email: contact.email,
            name: contact.name || null,
            status: 'active' as ContactStatus
          }));
        }
      } catch (error) {
        console.error('Error parsing contacts:', error);
      }
    }

    // Create contacts if any
    let createdContacts: Contact[] = [];
    if (contacts.length > 0) {
      const { data: insertedContacts, error: contactsError } = await supabaseAdmin
        .from('contacts')
        .insert(contacts)
        .select();

      if (contactsError) {
        throw new APIError('Failed to create contacts', 500);
      }

      if (insertedContacts) {
        createdContacts = insertedContacts;
      }
    }

    // Create initial newsletter with draft status
    const newsletterData: Partial<Newsletter> = {
      company_id: company.id,
      subject: `${company.company_name} Newsletter`,
      draft_status: 'pending' as DraftStatus,
      draft_recipient_email: company.contact_email,
      status: 'draft' as NewsletterStatus,
      sent_count: 0,
      failed_count: 0,
      last_sent_status: null,
      draft_sent_at: null,
      sent_at: null
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
    if (createdContacts.length > 0) {
      const newsletterContacts: Partial<NewsletterContact>[] = createdContacts.map(contact => ({
        newsletter_id: newsletter.id,
        contact_id: contact.id,
        status: 'pending' as NewsletterContactStatus,
        sent_at: null,
        error_message: null
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
        total_contacts: createdContacts.length
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
