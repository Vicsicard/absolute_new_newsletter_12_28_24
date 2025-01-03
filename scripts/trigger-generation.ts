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
  const newsletterId = '5ca93e4b-f783-4580-b727-882b84f72edd';
  
  try {
    // First get the existing sections to determine section numbers
    const { data: sections, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('section_number')
      .eq('newsletter_id', newsletterId)
      .order('section_number', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return;
    }

    if (!sections || sections.length === 0) {
      console.error('No sections found for newsletter');
      return;
    }

    // Create queue items for each section type
    const queueItems = [
      {
        newsletter_id: newsletterId,
        section_type: 'welcome',
        section_number: sections[0].section_number,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        newsletter_id: newsletterId,
        section_type: 'industry_trends',
        section_number: sections[1]?.section_number || sections[0].section_number + 1,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        newsletter_id: newsletterId,
        section_type: 'practical_tips',
        section_number: sections[2]?.section_number || (sections[1]?.section_number || sections[0].section_number) + 1,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('newsletter_generation_queue')
      .insert(queueItems);

    if (error) {
      console.error('Error creating queue items:', error);
      return;
    }

    console.log('Generation queue items created:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

triggerGeneration();
