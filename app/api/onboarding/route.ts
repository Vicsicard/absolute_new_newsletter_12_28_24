import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { OnboardingResponse } from '@/types/api';
import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/utils/api-middleware';
import type { 
  Company,
  Newsletter,
  NewsletterStatus,
  DraftStatus
} from '@/types/email';

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes

export const POST = withErrorHandler(async (req: NextRequest) => {
  console.log('Starting onboarding process...');
  const supabaseAdmin = getSupabaseAdmin();
  
  let jsonData: any;

  // Try to parse as JSON first, fallback to FormData
  try {
    jsonData = await req.json();
    console.log('Received JSON data:', jsonData);
  } catch (error) {
    console.warn('Failed to parse JSON, attempting FormData...');
    const clonedReq = req.clone();
    const formData = await clonedReq.formData();
    jsonData = Object.fromEntries(formData.entries());
    console.log('Received form data:', jsonData);
  }

  // Validate required fields
  if (!jsonData.company_name || !jsonData.industry || !jsonData.contact_email) {
    console.error('Missing required fields:', { jsonData });
    throw new Error('Missing required fields');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(jsonData.contact_email)) {
    console.error('Invalid email format:', jsonData.contact_email);
    throw new Error('Invalid email format');
  }

  // Create company
  console.log('Creating company...');
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert([{
      company_name: jsonData.company_name,
      industry: jsonData.industry,
      contact_email: jsonData.contact_email,
      target_audience: jsonData.target_audience || null,
      audience_description: jsonData.audience_description || null,
      website_url: jsonData.website_url || null,
      phone_number: jsonData.phone_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (companyError) {
    console.error('Error creating company:', companyError);
    throw new Error('Failed to create company');
  }

  console.log('Company created:', company);

  // Create newsletter
  console.log('Creating newsletter...');
  const newsletterData = {
    company_id: company.id,
    status: 'draft' as NewsletterStatus,
    subject: `${company.company_name} Newsletter`,
    draft_status: 'draft' as DraftStatus,
    draft_recipient_email: company.contact_email || jsonData.contact_email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newsletter, error: newsletterError } = await supabaseAdmin
    .from('newsletters')
    .insert(newsletterData)
    .select()
    .single();

  if (newsletterError) {
    console.error('Error creating newsletter:', newsletterError);
    // If newsletter creation fails, delete the company
    await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', company.id);
    
    throw new Error('Failed to create newsletter');
  }

  console.log('Newsletter created:', newsletter);

  // Wait for trigger to create queue items and sections
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify queue items and sections were created
  const { data: queueItems, error: queueError } = await supabaseAdmin
    .from('newsletter_generation_queue')
    .select('*')
    .eq('newsletter_id', newsletter.id)
    .order('created_at', { ascending: true });

  if (queueError) {
    console.error('Error verifying queue items:', queueError);
  } else {
    console.log('Queue items created:', queueItems);
  }

  const { data: sections, error: sectionsError } = await supabaseAdmin
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', newsletter.id)
    .order('section_number', { ascending: true });

  if (sectionsError) {
    console.error('Error verifying sections:', sectionsError);
  } else {
    console.log('Newsletter sections created:', sections);
  }

  // Create initial compiled newsletter record
  const { error: compiledError } = await supabaseAdmin
    .from('compiled_newsletters')
    .insert({
      newsletter_id: newsletter.id,
      html_content: '', 
      compiled_status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (compiledError) {
    console.error('Error creating compiled newsletter:', compiledError);
  }

  // Start the queue processor if not already running
  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    console.log('Starting queue processor...');
    await fetch(`${baseUrl}/api/queue/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ newsletterId: newsletter.id })
    });
    console.log('Queue processor started');
  } catch (error) {
    console.warn('Error starting queue processor:', error);
    // Don't throw here, as the trigger will handle it
  }

  // Return success response with created data
  console.log('Onboarding completed successfully');
  return NextResponse.json({
    success: true,
    company,
    newsletter,
    queueItems,
    sections,
    message: 'Your request is being processed'
  } as OnboardingResponse);
});
