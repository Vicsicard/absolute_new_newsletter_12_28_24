import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import type { OnboardingResponse } from '@/types/api';
import { APIError, ValidationError, DatabaseError } from '@/utils/errors';
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
    } catch (error) {
      console.warn('Failed to parse JSON, attempting FormData...');
      try {
        const formData = await clonedReq.formData();
        jsonData = Object.fromEntries(formData.entries());
      } catch (error) {
        console.error('Failed to parse request data');
        return NextResponse.json({ success: false }, { status: 400 });
      }
    }

    // Validate required fields
    if (!jsonData.company_name || !jsonData.industry || !jsonData.contact_email) {
      console.error('Missing required fields');
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(jsonData.contact_email)) {
      console.error('Invalid email format');
      return NextResponse.json({ success: false }, { status: 400 });
    }

    try {
      // Create company
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
        return NextResponse.json({ success: false }, { status: 500 });
      }

      // Create newsletter
      const newsletterData = {
        company_id: company.id,
        status: 'draft' as NewsletterStatus,
        subject: `${company.company_name} Newsletter`,
        draft_recipient_email: company.contact_email || jsonData.contact_email,  
        draft_status: 'pending' as DraftStatus,
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
        const { error: deleteError } = await supabaseAdmin
          .from('companies')
          .delete()
          .eq('id', company.id);
        
        if (deleteError) {
          console.error('Failed to cleanup company after newsletter error:', deleteError);
        }
        return NextResponse.json({ success: false }, { status: 500 });
      }

      // The database trigger will automatically create queue items and sections
      // No need to create them manually here

      // Start the queue processor if not already running
      try {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const response = await fetch(`${baseUrl}/api/queue/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ newsletterId: newsletter.id })
        });
        
        if (!response.ok) {
          console.warn('Failed to start queue processor:', await response.text());
        }
      } catch (error) {
        console.warn('Error starting queue processor:', error);
        // Don't throw here, as the trigger will handle it
      }

      // Return success response
      return NextResponse.json({
        success: true,
        company,
        newsletter,
        message: 'Onboarding completed successfully'
      });

    } catch (error) {
      console.error('Onboarding error:', error);
      return NextResponse.json({ success: false }, { status: 500 });
    }
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
