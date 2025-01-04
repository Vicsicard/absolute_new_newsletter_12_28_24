import { test, expect } from '@playwright/test';
import { getSupabaseAdmin } from '../utils/supabase-admin';
import { generateNewsletter } from '../utils/newsletter';

// Set a longer timeout since newsletter generation can take up to 18 minutes
test.describe('Email Integration Tests', () => {
  // 20 minutes timeout to account for generation and potential retries
  test.setTimeout(1200000);
  
  const supabase = getSupabaseAdmin();

  test('should generate and send newsletter draft', async () => {
    // Create a test company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: 'Test Email Company',
        industry: 'Technology',
        contact_email: process.env.BREVO_SENDER_EMAIL!, // Use our sender email for testing
        target_audience: 'Software developers',
        audience_description: 'Professional developers looking for the latest tech news'
      })
      .select()
      .single();

    if (companyError) {
      console.error('Failed to create company:', companyError);
      throw companyError;
    }
    expect(company).toBeTruthy();
    console.log('Created test company:', company);

    // Create a newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .insert({
        company_id: company!.id,
        subject: 'Test Newsletter Draft',
        draft_status: 'draft',
        status: 'draft'
      })
      .select()
      .single();

    if (newsletterError) {
      console.error('Failed to create newsletter:', newsletterError);
      throw newsletterError;
    }
    expect(newsletter).toBeTruthy();
    console.log('Created test newsletter:', newsletter);

    try {
      // Start the newsletter generation
      console.log('Starting newsletter generation...');
      await generateNewsletter(newsletter!.id, undefined, {
        companyName: company!.company_name,
        industry: company!.industry,
        targetAudience: company!.target_audience || undefined,
        audienceDescription: company!.audience_description || undefined
      });

      // Monitor the newsletter status until it's complete or times out
      console.log('Monitoring newsletter status...');
      const startTime = Date.now();
      const timeout = 1080000; // 18 minutes
      const checkInterval = 30000; // Check every 30 seconds

      while (Date.now() - startTime < timeout) {
        // Check newsletter status
        const { data: currentNewsletter, error: statusError } = await supabase
          .from('newsletters')
          .select('*')
          .eq('id', newsletter!.id)
          .single();

        if (statusError) {
          console.error('Error checking newsletter status:', statusError);
          throw statusError;
        }

        if (!currentNewsletter) {
          throw new Error('Newsletter not found');
        }

        // Get sections separately
        const { data: sections, error: sectionsError } = await supabase
          .from('newsletter_sections')
          .select('status')
          .eq('newsletter_id', newsletter!.id);

        if (sectionsError) {
          console.error('Error checking sections:', sectionsError);
          throw sectionsError;
        }

        // Log current status
        console.log('Current newsletter status:', {
          draft_status: currentNewsletter.draft_status,
          sections_complete: sections?.filter(s => s.status === 'completed').length || 0,
          total_sections: sections?.length || 0
        });

        // Check if the newsletter is complete (draft has been sent)
        if (currentNewsletter.draft_status === 'draft_sent') {
          console.log('Newsletter generation and email sending complete!');
          expect(currentNewsletter.draft_sent_at).toBeTruthy();
          return;
        }

        // Check for failure
        if (currentNewsletter.draft_status === 'failed') {
          throw new Error('Newsletter generation failed');
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }

      throw new Error('Newsletter generation timed out after 18 minutes');
    } finally {
      // Cleanup
      console.log('Cleaning up test data...');
      await supabase.from('newsletter_sections').delete().eq('newsletter_id', newsletter!.id);
      await supabase.from('newsletters').delete().eq('id', newsletter!.id);
      await supabase.from('companies').delete().eq('id', company!.id);
    }
  });
});
