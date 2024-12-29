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
  DraftStatus,
  NewsletterSectionStatus
} from '@/types/email';

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function POST(req: NextRequest) {
  console.log('Starting onboarding process...');
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    let companyData: Partial<Company>;
    let contactsData: any;
    let jsonData: any;

    // Clone the request before attempting to read it
    const clonedReq = req.clone();

    // Try to parse as JSON first, fallback to FormData
    try {
      jsonData = await req.json();
      companyData = {
        company_name: jsonData.company_name,
        industry: jsonData.industry,
        contact_email: jsonData.contact_email,
        target_audience: jsonData.target_audience || null,
        audience_description: jsonData.audience_description || null,
        website_url: jsonData.website_url || null,
        phone_number: jsonData.phone_number || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      contactsData = jsonData.contacts;
    } catch {
      // If JSON parsing fails, try FormData with the cloned request
      const formData = await clonedReq.formData();
      companyData = {
        company_name: formData.get('company_name') as string,
        industry: formData.get('industry') as string,
        contact_email: formData.get('contact_email') as string,
        target_audience: formData.get('target_audience') as string || null,
        audience_description: formData.get('audience_description') as string || null,
        website_url: formData.get('website_url') as string || null,
        phone_number: formData.get('phone_number') as string || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      contactsData = formData.get('contacts');
    }

    console.log('Received onboarding data:', jsonData);

    // Validate required fields
    const requiredFields = ['company_name', 'industry', 'contact_email'];
    for (const field of requiredFields) {
      if (!companyData[field as keyof typeof companyData]) {
        throw new APIError(`Missing required field: ${field}`, 400);
      }
    }

    // Create company
    console.log('Creating company...');
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (companyError || !company) {
      console.error('Error creating company:', companyError);
      throw new APIError('Failed to create company', 500);
    }

    console.log('Company created successfully:', company);

    // Parse and validate contacts
    let contacts: Array<Partial<Contact>> = [];
    if (contactsData) {
      try {
        const parsedContacts = typeof contactsData === 'string' ? JSON.parse(contactsData) : contactsData;
        if (Array.isArray(parsedContacts)) {
          contacts = parsedContacts.map((contact: { email: string; name?: string }) => ({
            company_id: company.id,
            email: contact.email,
            name: contact.name || null,
            status: 'active' as ContactStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
    console.log('Creating newsletter...');
    const newsletterData: Partial<Newsletter> = {
      company_id: company.id,
      subject: jsonData?.subject || `${company.company_name} Newsletter`,
      draft_status: 'pending' as DraftStatus,
      draft_recipient_email: company.contact_email,
      draft_sent_at: null,
      status: 'draft' as NewsletterStatus,
      sent_at: null,
      sent_count: 0,
      failed_count: 0,
      last_sent_status: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating newsletter with data:', newsletterData);

    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .insert(newsletterData)
      .select()
      .single();

    if (newsletterError || !newsletter) {
      console.error('Error creating newsletter:', newsletterError);
      throw new APIError('Failed to create newsletter', 500);
    }

    console.log('Newsletter created successfully:', newsletter);

    // Create initial newsletter section
    const sectionData = {
      newsletter_id: newsletter.id,
      section_number: 1,
      title: 'Welcome to Our Newsletter',
      content: `Welcome to ${company.company_name}'s newsletter! We're excited to share our latest updates and insights with you.`,
      image_prompt: null,
      image_url: null,
      status: 'active' as NewsletterSectionStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: sectionError } = await supabaseAdmin
      .from('newsletter_sections')
      .insert(sectionData);

    if (sectionError) {
      throw new APIError('Failed to create initial newsletter section', 500);
    }

    // Create newsletter contacts entries
    if (createdContacts.length > 0) {
      const newsletterContacts: Partial<NewsletterContact>[] = createdContacts.map(contact => ({
        newsletter_id: newsletter.id,
        contact_id: contact.id,
        status: 'pending' as NewsletterContactStatus,
        sent_at: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: newsletterContactsError } = await supabaseAdmin
        .from('newsletter_contacts')
        .insert(newsletterContacts);

      if (newsletterContactsError) {
        throw new APIError('Failed to create newsletter contacts', 500);
      }
    }

    // Generate and send draft newsletter
    try {
      // Get the host from the request headers
      const host = req.headers.get('host') || process.env.VERCEL_URL;
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      console.log('DEBUG - Request headers:', Object.fromEntries(req.headers.entries()));
      console.log('DEBUG - Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        host,
        protocol,
        baseUrl
      });

      // Start the newsletter generation process asynchronously
      console.log('Starting async newsletter generation...');
      const generateUrl = `${baseUrl}/api/newsletter/generate/${newsletter.id}`;
      fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsletterId: newsletter.id
        })
      }).catch(error => {
        console.error('Async newsletter generation error:', error);
      });

      // Return success immediately
      return NextResponse.json({
        success: true,
        message: 'Newsletter setup started. You will receive an email shortly.',
        data: {
          company,
          newsletter,
          contacts: createdContacts
        }
      });

    } catch (error) {
      console.error('Error in newsletter generation/sending process:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to setup newsletter' },
        { status: 500 }
      );
    }

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
