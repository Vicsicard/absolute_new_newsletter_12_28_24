import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Section types and their configuration
const SECTION_CONFIG = {
  welcome: {
    prompt: "Write a welcome message",
    sectionNumber: 1
  },
  industry_trends: {
    prompt: "Write about current industry trends and innovations",
    sectionNumber: 2
  },
  practical_tips: {
    prompt: "Provide practical tips and best practices",
    sectionNumber: 3
  }
};

// Status enums from schema
const NEWSLETTER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const NEWSLETTER_DRAFT_STATUS = {
  DRAFT: 'draft',
  DRAFT_SENT: 'draft_sent',
  PENDING_CONTACTS: 'pending_contacts',
  READY_TO_SEND: 'ready_to_send',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed'
};

const SECTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNextPendingItem() {
  try {
    // First get all pending items
    const { data: items, error } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('status', SECTION_STATUS.PENDING)
      .order('section_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending items:', error);
      return null;
    }

    if (!items || items.length === 0) {
      return null;
    }

    // For each item, verify the newsletter exists and is in the correct state
    for (const item of items) {
      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('id, status, draft_status')
        .eq('id', item.newsletter_id)
        .maybeSingle();

      if (newsletter && 
          newsletter.status === NEWSLETTER_STATUS.DRAFT && 
          [NEWSLETTER_DRAFT_STATUS.DRAFT, NEWSLETTER_DRAFT_STATUS.PENDING_CONTACTS].includes(newsletter.draft_status)) {
        return item;
      } else if (!newsletter) {
        // Newsletter doesn't exist, mark this queue item as failed
        console.log(`Newsletter ${item.newsletter_id} not found for queue item ${item.id}, marking as failed`);
        await updateQueueItem(item.id, {
          status: SECTION_STATUS.FAILED,
          error_message: 'Newsletter not found'
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getNextPendingItem:', error);
    return null;
  }
}

async function updateQueueItem(id, updates) {
  const { error } = await supabase
    .from('newsletter_generation_queue')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating queue item:', error);
    throw error;
  }
}

async function getNewsletterInfo(newsletterId) {
  // Get newsletter data
  const { data: newsletter, error: newsletterError } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', newsletterId)
    .single();

  if (newsletterError) throw newsletterError;
  if (!newsletter) throw new Error('Newsletter not found');

  // Get company data
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', newsletter.company_id)
    .single();

  if (companyError) throw companyError;
  if (!company) throw new Error('Company not found');

  return { newsletter, company };
}

async function updateNewsletterStatus(newsletterId) {
  // Get all sections for this newsletter
  const { data: sections, error: sectionsError } = await supabase
    .from('newsletter_sections')
    .select('status, section_type')
    .eq('newsletter_id', newsletterId);

  if (sectionsError) {
    console.error('Error checking newsletter completion:', sectionsError);
    return;
  }

  // Check if all sections are completed
  const allCompleted = sections?.every(section => section.status === SECTION_STATUS.COMPLETED) ?? false;
  const hasFailedSections = sections?.some(section => section.status === SECTION_STATUS.FAILED) ?? false;

  if (allCompleted) {
    console.log(`All sections completed for newsletter ${newsletterId}, updating status...`);
    
    // Update newsletter status to ready_to_send
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        draft_status: NEWSLETTER_DRAFT_STATUS.READY_TO_SEND,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
    } else {
      console.log(`Newsletter ${newsletterId} is ready to send!`);
    }
  } else if (hasFailedSections) {
    // If any section failed, mark the newsletter as failed
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        draft_status: NEWSLETTER_DRAFT_STATUS.FAILED,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
    } else {
      console.log(`Newsletter ${newsletterId} marked as failed due to failed sections`);
    }
  }
}

async function processQueueItem(item) {
  console.log(`Processing queue item: ${item.id} for newsletter ${item.newsletter_id}`);
  
  try {
    // Update status to in_progress
    await updateQueueItem(item.id, { 
      status: SECTION_STATUS.IN_PROGRESS,
      attempts: item.attempts + 1
    });

    // Get newsletter and company info
    const { newsletter, company } = await getNewsletterInfo(item.newsletter_id);

    // Generate content
    const prompt = SECTION_CONFIG[item.section_type].prompt;
    const messages = [{
      role: "system",
      content: "You are a professional newsletter writer specializing in business content."
    }, {
      role: "user",
      content: `${prompt} for ${company.company_name}, a ${company.industry} company targeting ${company.target_audience || 'general audience'}. 
      Make it engaging and actionable. Include a title for this section.`
    }];

    console.log(`Generating content for section ${item.section_type}...`);
    const response = await callOpenAIWithRetry(messages);

    // Extract title and content
    const lines = response.split('\n').filter(line => line.trim());
    const title = lines[0].replace(/^#*\s*/, '');
    const content = lines.slice(1).join('\n').trim();

    console.log(`Content generated for section ${item.section_type}. Title: ${title}`);

    // Update newsletter section
    const { error: sectionError } = await supabase
      .from('newsletter_sections')
      .upsert({
        newsletter_id: item.newsletter_id,
        section_number: SECTION_CONFIG[item.section_type].sectionNumber,
        section_type: item.section_type,
        title,
        content,
        status: SECTION_STATUS.COMPLETED,
        updated_at: new Date().toISOString()
      });

    if (sectionError) throw sectionError;

    // Mark queue item as completed
    await updateQueueItem(item.id, { 
      status: SECTION_STATUS.COMPLETED,
      completed_at: new Date().toISOString()
    });

    console.log(`Successfully processed queue item ${item.id}`);

    // Update newsletter status
    await updateNewsletterStatus(item.newsletter_id);

  } catch (error) {
    console.error(`Error processing queue item ${item.id}:`, error);
    
    // Check if we should retry or mark as failed
    const shouldRetry = item.attempts < 3;
    
    await updateQueueItem(item.id, { 
      status: shouldRetry ? SECTION_STATUS.PENDING : SECTION_STATUS.FAILED,
      error_message: error.message
    });

    if (!shouldRetry) {
      // If we're not retrying, update the section status to failed
      const { error: sectionError } = await supabase
        .from('newsletter_sections')
        .upsert({
          newsletter_id: item.newsletter_id,
          section_number: SECTION_CONFIG[item.section_type].sectionNumber,
          section_type: item.section_type,
          status: SECTION_STATUS.FAILED,
          updated_at: new Date().toISOString()
        });

      if (sectionError) {
        console.error('Error updating section status:', sectionError);
      }

      // Update newsletter status to check for failures
      await updateNewsletterStatus(item.newsletter_id);
    }

    throw error;
  }
}

async function processQueue() {
  while (true) {
    try {
      const item = await getNextPendingItem();
      
      if (!item) {
        console.log('No pending items, waiting...');
        await sleep(5000);
        continue;
      }

      await processQueueItem(item);

    } catch (error) {
      console.error('Error in queue processing:', error);
      await sleep(5000);
    }
  }
}

// Helper function to call OpenAI with retry
async function callOpenAIWithRetry(messages, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`OpenAI API error (attempt ${attempt + 1}/${retries}):`, error);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}

// Start the queue processor
console.log('Starting queue processor...');
processQueue().catch(error => {
  console.error('Fatal error in queue processor:', error);
  process.exit(1);
});
