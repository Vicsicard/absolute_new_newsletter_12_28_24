import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function triggerGeneration() {
  try {
    // 1. Create a test company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: 'Test Company',
        industry: 'Technology',
        contact_email: 'test@example.com',
        target_audience: 'Tech professionals',
        audience_description: 'Software developers and IT professionals',
        website_url: 'https://example.com',
        phone_number: '+1234567890'
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return;
    }

    console.log('Created company:', company);

    // 2. Create a newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .insert({
        company_id: company.id,
        subject: `Test Newsletter ${new Date().toISOString()}`,
        status: 'draft',
        draft_status: 'draft',
        draft_recipient_email: 'test@example.com'
      })
      .select()
      .single();

    if (newsletterError) {
      console.error('Error creating newsletter:', newsletterError);
      return;
    }

    console.log('Created newsletter:', newsletter);

    // 3. Check for existing sections
    const { data: existingSections } = await supabase
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', newsletter.id);

    // Only create sections if none exist
    if (!existingSections || existingSections.length === 0) {
      // Create newsletter sections
      const sections = [
        {
          newsletter_id: newsletter.id,
          section_number: 1,
          section_type: 'welcome',
          status: 'pending'
        },
        {
          newsletter_id: newsletter.id,
          section_number: 2,
          section_type: 'industry_trends',
          status: 'pending'
        },
        {
          newsletter_id: newsletter.id,
          section_number: 3,
          section_type: 'practical_tips',
          status: 'pending'
        }
      ];

      const { data: createdSections, error: sectionsError } = await supabase
        .from('newsletter_sections')
        .insert(sections)
        .select();

      if (sectionsError) {
        console.error('Error creating sections:', sectionsError);
        return;
      }

      console.log('Created sections:', createdSections);

      // 4. Create queue items
      const queueItems = sections.map(section => ({
        newsletter_id: newsletter.id,
        section_type: section.section_type,
        section_number: section.section_number,
        status: 'pending',
        attempts: 0
      }));

      const { data: queueData, error: queueError } = await supabase
        .from('newsletter_generation_queue')
        .insert(queueItems);

      if (queueError) {
        console.error('Error creating queue items:', queueError);
        return;
      }

      console.log('Generation queue items created successfully');
    } else {
      console.log('Sections already exist for this newsletter');
    }

    console.log('Newsletter ID:', newsletter.id);
    console.log('Company ID:', company.id);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

triggerGeneration();
