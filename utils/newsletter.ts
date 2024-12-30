import OpenAI from 'openai';
import type { Database } from '@/types/database';
import { NewsletterWithCompany, NewsletterSection, NewsletterSectionStatus } from '@/types/email';
import { getSupabaseAdmin } from './supabase-admin';
import { APIError } from './errors';
import { generateImage } from './image';

// Use Supabase types
type NewsletterSectionInsert = Database['public']['Tables']['newsletter_sections']['Insert'];
type NewsletterSectionRow = Database['public']['Tables']['newsletter_sections']['Row'];

interface GenerateOptions {
  companyName: string;
  industry: string;
  targetAudience?: string;
  audienceDescription?: string;
}

// Section types and their prompts
const SECTION_CONFIG = {
  pain_point: {
    prompt: `Create a professional newsletter section that analyzes a critical industry pain point.
Format:
- Headline: Dynamic and engaging
- Introduction: One paragraph outlining the pain point
- Why It Matters: Three bullet points explaining importance
- The Solution: How the company addresses this
- The Takeaway: Strong summary with call to action`,
    sectionNumber: 1
  },
  common_mistakes: {
    prompt: `Create a professional newsletter section about common industry mistakes.
Format:
- Headline: Dynamic and focused on industry mistakes
- Introduction: One paragraph about common pitfalls
- Mistakes to Avoid: Three specific industry mistakes
- How Company Helps: Specific solutions
- The Takeaway: Encouraging summary with call to action`,
    sectionNumber: 2
  },
  company_solutions: {
    prompt: `Create a professional newsletter section showcasing company solutions.
Format:
- Headline: Dynamic and solution-focused
- Introduction: One paragraph about company's approach
- How Company Helps: Three specific solutions
- Why It's a Game-Changer: Impact explanation
- The Takeaway: Clear next steps for readers`,
    sectionNumber: 3
  }
} as const;

type SectionType = keyof typeof SECTION_CONFIG;

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function validateOpenAIKey() {
  try {
    // Try a simple API call to validate the key
    await openai.models.list();
    return true;
  } catch (error: any) {
    console.error('OpenAI API key validation failed:', {
      error: error.message,
      status: error.status,
      type: error.type
    });
    return false;
  }
}

async function callOpenAIWithRetry(messages: any[], retries = 3, delay = 500): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.1,  // Slight penalty to encourage varied content
        frequency_penalty: 0.1  // Slight penalty to discourage repetition
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }
      return response;
    } catch (error: any) {
      console.error(`OpenAI API attempt ${i + 1} failed:`, error);
      
      if (error?.status === 429) { // Rate limit error
        const waitTime = Math.min(delay * Math.pow(1.2, i), 2000); // Shorter backoff since we have high limits
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (i === retries - 1) {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}

// Track DALL-E usage to stay within 15 images per minute limit
let imageGenerationTimestamps: number[] = [];
const IMAGE_RATE_LIMIT = 15;
const ONE_MINUTE = 60000;

async function waitForImageRateLimit() {
  const now = Date.now();
  imageGenerationTimestamps = imageGenerationTimestamps.filter(timestamp => 
    now - timestamp < ONE_MINUTE
  );
  
  if (imageGenerationTimestamps.length >= IMAGE_RATE_LIMIT) {
    const oldestTimestamp = imageGenerationTimestamps[0];
    const waitTime = ONE_MINUTE - (now - oldestTimestamp);
    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}ms to respect DALL-E rate limit`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  imageGenerationTimestamps.push(now);
}

async function initializeGenerationQueue(
  newsletterId: string,
  supabaseAdmin: any
): Promise<void> {
  try {
    // First, delete any existing queue items for this newsletter
    const { error: deleteError } = await supabaseAdmin
      .from('newsletter_generation_queue')
      .delete()
      .eq('newsletter_id', newsletterId);

    if (deleteError) {
      console.error('Error deleting existing queue items:', deleteError);
      throw new APIError('Failed to clear existing queue items', 500);
    }

    // Create queue items for each section
    const queueItems = Object.entries(SECTION_CONFIG).map(([type, config]) => ({
      newsletter_id: newsletterId,
      section_type: type,
      section_number: config.sectionNumber,
      status: 'pending',
      attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert new queue items
    const { error: insertError } = await supabaseAdmin
      .from('newsletter_generation_queue')
      .insert(queueItems);

    if (insertError) {
      console.error('Error inserting queue items:', insertError);
      throw new APIError('Failed to initialize generation queue', 500);
    }
  } catch (error) {
    console.error('Error in initializeGenerationQueue:', error);
    throw new APIError('Failed to initialize generation queue', 500);
  }
}

async function updateQueueItemStatus(
  supabaseAdmin: any,
  newsletterId: string,
  sectionType: SectionType,
  status: 'in_progress' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Use a transaction to safely update the queue item
  const { data: queueItem, error: selectError } = await supabaseAdmin
    .from('newsletter_generation_queue')
    .select('attempts')
    .eq('newsletter_id', newsletterId)
    .eq('section_type', sectionType)
    .single();

  if (selectError) {
    console.error('Error fetching queue item:', selectError);
    return;
  }

  const attempts = status === 'failed' ? (queueItem?.attempts || 0) + 1 : undefined;

  const { error: updateError } = await supabaseAdmin
    .from('newsletter_generation_queue')
    .update({
      status,
      error_message: errorMessage,
      last_attempt_at: timestamp,
      attempts,
      updated_at: timestamp
    })
    .eq('newsletter_id', newsletterId)
    .eq('section_type', sectionType);

  if (updateError) {
    console.error('Error updating queue item status:', updateError);
    // Don't throw here as this is not critical
  }
}

export async function generateNewsletter(
  newsletterId: string,
  customPrompt?: string,
  options?: GenerateOptions
): Promise<NewsletterSection[]> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    console.log('Starting newsletter generation for:', { newsletterId, customPrompt });
    console.log('Current environment:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      env: process.env.NODE_ENV
    });

    if (!options) {
      // Get company data from newsletter if options not provided
      console.log('Fetching company data for newsletter:', newsletterId);
      type NewsletterWithCompanyResult = {
        data: NewsletterWithCompany | null;
        error: any;
      };

      const { data: newsletter, error: newsletterError } = await supabaseAdmin
        .from('newsletters')
        .select(`
          *,
          company:companies (
            company_name,
            industry,
            target_audience,
            audience_description,
            contact_email
          )
        `)
        .eq('id', newsletterId)
        .single() as NewsletterWithCompanyResult;

      if (newsletterError) {
        console.error('Error fetching newsletter data:', newsletterError);
        throw new APIError('Failed to fetch newsletter data', 500);
      }

      if (!newsletter || !newsletter.company) {
        console.error('Newsletter or company data not found');
        throw new APIError('Newsletter or company data not found', 404);
      }

      console.log('Successfully fetched newsletter data:', {
        companyName: newsletter.company.company_name,
        industry: newsletter.company.industry
      });

      options = {
        companyName: newsletter.company.company_name,
        industry: newsletter.company.industry,
        targetAudience: newsletter.company.target_audience || undefined,
        audienceDescription: newsletter.company.audience_description || undefined
      };
    }

    // Validate OpenAI key
    const isValidKey = await validateOpenAIKey();
    if (!isValidKey) {
      throw new APIError('Invalid OpenAI API key', 500);
    }

    // Initialize generation queue
    await initializeGenerationQueue(newsletterId, supabaseAdmin);

    const sections: NewsletterSectionInsert[] = [];

    // Generate each section
    for (const [sectionType, config] of Object.entries(SECTION_CONFIG) as [SectionType, typeof SECTION_CONFIG[SectionType]][]) {
      console.log(`Generating section ${config.sectionNumber} (${sectionType})...`);
      
      try {
        // Update queue status to in_progress
        await updateQueueItemStatus(supabaseAdmin, newsletterId, sectionType, 'in_progress');

        const prompt = sectionType === 'welcome' ? config.prompt : (customPrompt || config.prompt);
        
        // Base system message for GPT-4
        const systemMessage = {
          role: 'system',
          content: `You are a professional content creator specializing in crafting engaging, polished newsletters for businesses.
Your goal is to create high-quality, industry-specific newsletter sections that are informative, engaging, and actionable.

Company Context:
- Company Name: ${options.companyName}
- Industry: ${options.industry}
${options.targetAudience ? `- Target Audience: ${options.targetAudience}` : ''}
${options.audienceDescription ? `- Audience Description: ${options.audienceDescription}` : ''}

Guidelines:
- Write in a professional, clear, and concise tone
- Use persuasive language to emphasize company strengths
- Include a touch of empathy to connect with the audience
- Each section should be standalone and complete
- Format content according to the specified structure
- Keep content relevant to ${options.industry} industry`
        };

        const response = await callOpenAIWithRetry([systemMessage, {
          role: "user",
          content: prompt
        }]);

        console.log(`Generated content for section ${config.sectionNumber}:`, response.substring(0, 100) + '...');

        // Extract title and content
        const lines = response.split('\n').filter(line => line.trim());
        const title = lines[0].replace(/^#*\s*/, ''); // Remove any markdown heading symbols
        const content = lines.slice(1).join('\n').trim();

        console.log(`Extracted title for section ${config.sectionNumber}:`, title);

        // Generate image for this section
        const imagePrompt = `Create a modern, professional abstract image representing ${options.industry} concepts. The image should be minimalist and symbolic, focusing on geometric shapes, gradients, or abstract patterns. Do not include any text, letters, numbers, or human figures. Use a professional color palette suitable for ${options.industry}. The image should convey the concept of ${title} through abstract visual elements only, such as flowing lines, interconnected shapes, or dynamic compositions. Make it suitable for a business newsletter background.`;
        console.log(`Generating image for section ${config.sectionNumber} with prompt:`, imagePrompt);
        
        let imageUrl = null;
        try {
          await waitForImageRateLimit();
          imageUrl = await generateImage(imagePrompt);
          console.log(`Generated image URL for section ${config.sectionNumber}:`, imageUrl);
        } catch (imageError) {
          console.error(`Error generating image for section ${config.sectionNumber}:`, imageError);
          // Continue without image if image generation fails
        }

        // Upsert this section
        const { error: upsertError } = await supabaseAdmin
          .from('newsletter_sections')
          .upsert({
            newsletter_id: newsletterId,
            section_number: config.sectionNumber,
            title,
            content,
            image_prompt: imagePrompt,
            image_url: imageUrl,
            status: 'active' as NewsletterSectionStatus,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'newsletter_id,section_number'
          });

        if (upsertError) {
          throw new Error(`Failed to upsert section: ${upsertError.message}`);
        }

        // Update queue status to completed
        await updateQueueItemStatus(supabaseAdmin, newsletterId, sectionType, 'completed');

        // Add delay between sections to avoid rate limits
        if (sectionType !== 'company_solutions') {
          console.log('Waiting before generating next section...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (sectionError) {
        console.error(`Error generating section ${config.sectionNumber}:`, sectionError);
        await updateQueueItemStatus(
          supabaseAdmin,
          newsletterId,
          sectionType,
          'failed',
          sectionError instanceof Error ? sectionError.message : 'Unknown error'
        );
        throw sectionError;
      }
    }

    // Get all sections after generation
    const { data: finalSections, error: fetchError } = await supabaseAdmin
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', newsletterId)
      .order('section_number', { ascending: true });

    if (fetchError) {
      console.error('Error fetching final sections:', fetchError);
      throw new APIError('Failed to fetch final sections', 500);
    }

    console.log('Successfully generated/updated all sections');
    return finalSections;

  } catch (error) {
    console.error('Error generating newsletter:', error);
    throw error instanceof APIError ? error : new APIError('Failed to generate newsletter', 500);
  }
}

interface NewsletterSectionContent {
  title: string;
  content: string;
  imageUrl?: string;
}

export function formatNewsletterHtml(sections: NewsletterSectionContent[]): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
      ${sections.map((section, index) => `
        <div style="margin-bottom: 40px; background-color: #ffffff; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            ${section.title}
          </h2>
          ${section.imageUrl ? `
            <div style="margin: 20px 0;">
              <img src="${section.imageUrl}" alt="Section illustration" style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 auto;">
            </div>
          ` : ''}
          <div style="color: #34495e; font-size: 16px;">
            ${section.content.split('\n').map(paragraph => 
              paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')
                ? `<li style="margin-bottom: 10px;">${paragraph.replace(/^[-•]\s*/, '')}</li>`
                : paragraph.toLowerCase().includes('takeaway')
                  ? `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">${paragraph}</div>`
                  : `<p style="margin-bottom: 15px;">${paragraph}</p>`
            ).join('')}
          </div>
          ${index < sections.length - 1 ? '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export async function validateEmailList(emails: string[]) {
  return emails.every(email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });
}
