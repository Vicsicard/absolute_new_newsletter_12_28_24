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
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export async function POST(req: NextRequest) {
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

    // Validate required fields
    const requiredFields = ['company_name', 'industry', 'contact_email'];
    for (const field of requiredFields) {
      if (!companyData[field as keyof typeof companyData]) {
        throw new APIError(`Missing required field: ${field}`, 400);
      }
    }

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
    const newsletterData: Partial<Newsletter> = {
      company_id: company.id,
      subject: jsonData?.subject || `${company.company_name} Newsletter`,
      draft_status: 'pending' as DraftStatus,
      draft_recipient_email: 'vicsicard@gmail.com', // Set your email directly for testing
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
      console.error('Failed to create newsletter:', newsletterError);
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

      // Generate and send draft newsletter
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        console.log('Starting newsletter generation and sending process:', {
          baseUrl,
          newsletterId: newsletter.id,
          companyId: company.id,
          recipientCount: createdContacts.length
        });

        // First generate the newsletter content
        console.log('Step 1: Generating newsletter content...');
        const generateResponse = await fetch(`${baseUrl}/api/newsletter/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newsletterId: newsletter.id
          })
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          console.error('Failed to generate newsletter:', {
            status: generateResponse.status,
            statusText: generateResponse.statusText,
            error: errorText
          });
        } else {
          const generateResult = await generateResponse.json();
          console.log('Newsletter generated successfully:', generateResult);
        }

        // Add a delay before sending to ensure content is ready
        console.log('Waiting for content generation to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Then send the draft
        console.log('Step 2: Sending draft newsletter...');
        const sendDraftResponse = await fetch(`${baseUrl}/api/newsletter/send-draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newsletterId: newsletter.id
          })
        });

        if (!sendDraftResponse.ok) {
          const errorText = await sendDraftResponse.text();
          console.error('Failed to send draft:', {
            status: sendDraftResponse.status,
            statusText: sendDraftResponse.statusText,
            error: errorText
          });
        } else {
          const sendResult = await sendDraftResponse.json();
          console.log('Draft sent successfully:', sendResult);
        }
      } catch (error) {
        console.error('Error in newsletter generation/sending process:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
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
