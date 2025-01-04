import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join } from 'path';
import OpenAI from 'openai';
import { generateEmailHTML } from '@/utils/email-template';
import { sendEmail } from '@/utils/email';
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@sendinblue/client';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Section types and their prompts
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
} as const;

type SectionType = keyof typeof SECTION_CONFIG;

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  section_number: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  attempts?: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

interface Newsletter {
  id: string;
  company_id: string;
  subject: string;
  status: 'draft' | 'generating' | 'ready' | 'sent' | 'error';
  draft_status: 'draft' | 'generating' | 'ready' | 'sent' | 'error';
  draft_recipient_email: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  company_name: string;
  industry: string;
  contact_email: string;
  target_audience?: string;
  audience_description?: string;
  website_url?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

interface NewsletterSection {
  id: string;
  newsletter_id: string;
  section_type: string;
  section_number: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company_id: string;
  status: 'active' | 'deleted';
  created_at: string | null;
  updated_at: string | null;
}

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'BREVO_SENDER_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('Starting queue processor with configuration:', {
  openaiKey: process.env.OPENAI_API_KEY ? 'set' : 'missing',
  supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'missing',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
  brevoKey: process.env.BREVO_API_KEY ? 'set' : 'missing',
  brevoEmail: process.env.BREVO_SENDER_EMAIL ? 'set' : 'missing',
  brevoName: process.env.BREVO_SENDER_NAME ? 'set' : 'missing'
});

// Constants for rate limiting and delays
const RATE_LIMIT_DELAY = 5000; // 5 seconds between API calls
const PROCESS_INTERVAL = 30000; // 30 seconds between checking for new items
const MAX_CONCURRENT_REQUESTS = 3;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds
let activeRequests = 0;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNextPendingItem(): Promise<QueueItem | null> {
  console.log('Checking for pending items...');
  
  // Get the pending queue item exactly as defined in the schema
  const { data: items, error } = await supabase
    .from('newsletter_generation_queue')
    .select(`
      id,
      newsletter_id,
      section_type,
      section_number,
      status,
      attempts,
      error_message,
      created_at,
      updated_at
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching next item:', error);
    return null;
  }

  if (!items || items.length === 0) {
    console.log('No pending items found');
    return null;
  }

  const item = items[0];

  // Get the newsletter exactly as defined in the schema
  const { data: newsletter, error: newsletterError } = await supabase
    .from('newsletters')
    .select(`
      id,
      company_id,
      subject,
      status,
      draft_status,
      draft_recipient_email,
      created_at,
      updated_at
    `)
    .eq('id', item.newsletter_id)
    .single();

  if (newsletterError) {
    console.error('Error fetching newsletter:', newsletterError);
    return null;
  }

  // Get the company exactly as defined in the schema
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id,
      company_name,
      industry,
      contact_email,
      target_audience,
      audience_description,
      website_url,
      phone_number,
      created_at,
      updated_at
    `)
    .eq('id', newsletter.company_id)
    .single();

  if (companyError) {
    console.error('Error fetching company:', companyError);
    return null;
  }

  console.log('Found pending item:', {
    id: item.id,
    newsletter_id: item.newsletter_id,
    section_type: item.section_type,
    newsletter_subject: newsletter?.subject,
    company_name: company?.company_name,
    industry: company?.industry
  });

  return {
    ...item,
    newsletters: {
      ...newsletter,
      companies: company
    }
  };
}

async function updateQueueItem(id: string, updates: Partial<QueueItem>) {
  const { error } = await supabase
    .from('newsletter_generation_queue')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating queue item:', error);
    throw error;
  }
}

async function getNewsletterInfo(newsletterId: string): Promise<{ newsletter: Newsletter; company: Company }> {
  const { data: newsletter, error: newsletterError } = await supabase
    .from('newsletters')
    .select(`
      id,
      company_id,
      subject,
      status,
      draft_status,
      draft_recipient_email,
      created_at,
      updated_at
    `)
    .eq('id', newsletterId)
    .single();

  if (newsletterError || !newsletter) {
    throw new Error('Newsletter not found');
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id,
      company_name,
      industry,
      contact_email,
      target_audience,
      audience_description,
      website_url,
      phone_number,
      created_at,
      updated_at
    `)
    .eq('id', newsletter.company_id)
    .single();

  if (companyError || !company) {
    throw new Error('Company not found');
  }

  return { newsletter, company };
}

async function processQueueItem(item: QueueItem): Promise<void> {
  console.log(`Processing section ${item.section_type} for newsletter ${item.newsletter_id}`);
  console.log(`Processing queue item ${item.id} for newsletter ${item.newsletter_id}`);

  try {
    // First verify the newsletter exists
    const { data: newsletterExists } = await supabase
      .from('newsletters')
      .select('id')
      .eq('id', item.newsletter_id)
      .single();

    if (!newsletterExists) {
      throw new Error(`Newsletter ${item.newsletter_id} not found`);
    }

    // Check if section already exists
    const { data: existingSections } = await supabase
      .from('newsletter_sections')
      .select('id, status')
      .eq('newsletter_id', item.newsletter_id)
      .eq('section_number', item.section_number)
      .limit(1);

    // If section exists and is completed, mark queue item as completed
    if (existingSections && existingSections.length > 0) {
      if (existingSections[0].status === 'completed') {
        await supabase
          .from('newsletter_generation_queue')
          .update({ status: 'completed' })
          .eq('id', item.id);
        console.log(`Section ${item.section_number} already exists and is completed for newsletter ${item.newsletter_id}`);
        return;
      } else {
        // If section exists but isn't completed, throw error
        throw new Error(`Section ${item.section_number} already exists for newsletter ${item.newsletter_id} with status ${existingSections[0].status}`);
      }
    }

    // Get newsletter and company info for content generation
    const { newsletter, company } = await getNewsletterInfo(item.newsletter_id);
    if (!company) {
      throw new Error(`Company not found for newsletter ${item.newsletter_id}`);
    }

    // Update queue item status to in_progress
    await supabase
      .from('newsletter_generation_queue')
      .update({ status: 'in_progress' })
      .eq('id', item.id);

    // Generate content based on section type
    const config = SECTION_CONFIG[item.section_type as SectionType];
    if (!config) {
      throw new Error(`Invalid section type: ${item.section_type}`);
    }

    console.log(`Generating content for section ${item.section_type}...`);
    const content = await generateContent(config.prompt, company, newsletter);
    console.log(`Generated content for section ${item.section_type}`);

    // Create newsletter section
    const { error: sectionError } = await supabase
      .from('newsletter_sections')
      .insert({
        newsletter_id: item.newsletter_id,
        section_number: item.section_number,
        section_type: item.section_type,
        title: config.title,
        content,
        status: 'completed'
      });

    if (sectionError) {
      throw sectionError;
    }

    // Update queue item status to completed
    await supabase
      .from('newsletter_generation_queue')
      .update({ status: 'completed' })
      .eq('id', item.id);

    console.log(`Successfully processed section ${item.section_type}`);

  } catch (error) {
    console.error('Error processing queue item:', error);

    // Update attempts count and status
    const attempts = (item.attempts || 0) + 1;
    const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('newsletter_generation_queue')
      .update({
        status,
        attempts,
        error_message: errorMessage
      })
      .eq('id', item.id);

    if (status === 'failed') {
      console.error(`Queue item ${item.id} failed after ${attempts} attempts: ${errorMessage}`);
    } else {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

async function updateNewsletterStatus(newsletterId: string): Promise<void> {
  // Get all sections for the newsletter
  const { data: sections, error } = await supabase
    .from('newsletter_sections')
    .select('status')
    .eq('newsletter_id', newsletterId);

  if (error) {
    console.error('Error checking newsletter sections:', error);
    return;
  }

  // Check if all sections are completed
  const allCompleted = sections.every(section => section.status === 'completed');
  if (allCompleted) {
    // Get newsletter and company info
    const { newsletter, company } = await getNewsletterInfo(newsletterId);

    // Update newsletter status to ready
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
      return;
    }

    console.log(`All sections completed for newsletter ${newsletterId}. Starting email send...`);

    // Send the newsletter
    try {
      await sendNewsletterEmail(newsletter, company);
    } catch (error) {
      console.error('Error sending newsletter:', error);
    }
  }
}

async function sendNewsletterEmail(newsletter: Newsletter, company: Company): Promise<void> {
  try {
    console.log(`Preparing to send newsletter ${newsletter.id} for company ${company.company_name}`);

    // Get all sections
    const sections = await getNewsletterSections(newsletter.id);
    
    // Build email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .section { margin-bottom: 30px; }
            h1 { color: #2c3e50; }
            h2 { color: #34495e; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${newsletter.subject}</h1>
            ${sections
              .sort((a, b) => a.section_number - b.section_number)
              .map(section => `
                <div class="section">
                  <h2>${section.section_type.replace(/_/g, ' ').toUpperCase()}</h2>
                  ${section.content}
                </div>
              `)
              .join('')}
          </div>
        </body>
      </html>
    `;

    // Send email using Brevo
    const apiInstance = new TransactionalEmailsApi();
    apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = newsletter.subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME!,
      email: process.env.BREVO_SENDER_EMAIL!
    };

    // For draft, send to draft_recipient_email
    if (newsletter.draft_recipient_email) {
      sendSmtpEmail.to = [{
        email: newsletter.draft_recipient_email,
        name: newsletter.draft_recipient_email.split('@')[0]
      }];
    }

    console.log(`Sending email to ${newsletter.draft_recipient_email}`);
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully');

    // Update newsletter status
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        draft_status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletter.id);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('Error sending newsletter:', error);
    
    // Update newsletter status to error
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        draft_status: 'error',
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletter.id);

    if (updateError) {
      console.error('Error updating newsletter status:', updateError);
    }
    
    throw error;
  }
}

async function getNewsletterContacts(companyId: string): Promise<Contact[]> {
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }

  return contacts;
}

async function getNewsletterSections(newsletterId: string): Promise<NewsletterSection[]> {
  const { data: sections, error } = await supabase
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .order('section_number', { ascending: true });

  if (error) {
    console.error('Error fetching newsletter sections:', error);
    throw error;
  }

  return sections;
}

async function processQueue(): Promise<void> {
  console.log('\nProcessing queue...');
  
  const item = await getNextPendingItem();
  if (!item) {
    return;
  }

  try {
    // Update status to in_progress
    await updateQueueItemStatus(item.newsletter_id, item.section_type as SectionType, 'in_progress');

    console.log(`Processing section ${item.section_type} for newsletter ${item.newsletter_id}`);
    
    // Process the item
    await processQueueItem(item);

  } catch (error) {
    console.error('Error processing queue item:', error);
    
    // Update status to failed
    await updateQueueItemStatus(
      item.newsletter_id,
      item.section_type as SectionType,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function checkQueueStatus(): Promise<void> {
  console.log('Checking queue status...');
  
  const { data: queueItems, error } = await supabase
    .from('newsletter_generation_queue')
    .select(`
      id,
      newsletter_id,
      section_type,
      section_number,
      status,
      attempts,
      error_message,
      created_at,
      updated_at
    `)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error checking queue status:', error);
    return;
  }

  if (queueItems && queueItems.length > 0) {
    console.log('Found pending queue items:');
    queueItems.forEach(item => {
      console.log(`- Queue Item ${item.id}:`);
      console.log(`  Newsletter: ${item.newsletter_id}`);
      console.log(`  Section: ${item.section_type}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Created: ${item.created_at}`);
      console.log('');
    });
  } else {
    console.log('No pending items in queue');
  }
}

async function startProcessor() {
  console.log('Starting queue processor...');
  await checkQueueStatus();
  processQueue();
}

startProcessor().catch(error => {
  console.error('Error starting processor:', error);
  process.exit(1);
});

// Set up interval to check for new items
setInterval(() => {
  processQueue().catch(error => {
    console.error('Error in queue processing:', error);
  });
}, PROCESS_INTERVAL);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping queue processor...');
  process.exit();
});

// Helper function to call OpenAI with retry
async function callOpenAIWithRetry(messages: any) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    await sleep(RATE_LIMIT_DELAY);
    return await callOpenAIWithRetry(messages);
  }
}

// Helper function to update queue item status
async function updateQueueItemStatus(
  newsletterId: string,
  sectionType: SectionType,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('newsletter_generation_queue')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('newsletter_id', newsletterId)
    .eq('section_type', sectionType);

  if (error) {
    console.error('Error updating queue item status:', error);
    throw error;
  }
}

async function getCompany(companyId: string): Promise<Company> {
  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      id,
      company_name,
      industry,
      contact_email,
      target_audience,
      audience_description,
      website_url,
      phone_number,
      created_at,
      updated_at
    `)
    .eq('id', companyId)
    .single();

  if (error || !company) {
    throw new Error('Company not found');
  }

  return company;
}

async function generateContent(prompt: string, company: Company, newsletter: Newsletter): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: `You are a professional newsletter writer. Write content for a ${company.industry} company newsletter. The company name is ${company.company_name}.`
    },
    {
      role: 'user',
      content: `${prompt} for ${company.company_name}. Target audience: ${company.target_audience || 'general audience'}. ${company.audience_description ? `Audience details: ${company.audience_description}` : ''}`
    }
  ];

  return await callOpenAIWithRetry(messages);
}
