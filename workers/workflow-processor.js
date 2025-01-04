// Newsletter Generation Worker Process
// Created: 2025-01-04
// Purpose: Process newsletter generation queue items and update section content

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Brevo API configuration
const BREVO_API_URL = 'https://api.brevo.com/v3';

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
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateContent(companyName, industry, targetAudience, sectionType) {
  const config = SECTION_CONFIG[sectionType];
  if (!config) {
    throw new Error(`Invalid section type: ${sectionType}`);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional newsletter writer specializing in business content."
      },
      {
        role: "user",
        content: `${config.prompt} for ${companyName}, a ${industry} company targeting ${targetAudience || 'general audience'}. 
        Make it engaging and actionable. Include a title for this section.`
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  const content = response.choices[0].message.content;
  const lines = content.split('\n').filter(line => line.trim());
  const title = lines[0].replace(/^#*\s*/, '');
  const body = lines.slice(1).join('\n').trim();

  return { title, content: body };
}

async function generateImage(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    style: "natural"
  });

  return response.data[0].url;
}

async function sendBrevoEmail(to, subject, htmlContent) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL || !process.env.BREVO_SENDER_NAME) {
    throw new Error('Missing required Brevo environment variables');
  }

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME
      },
      to: [{
        email: to,
      }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brevo API error: ${error.message}`);
  }

  return await response.json();
}

async function generateNewsletterHTML(sections) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .section { margin-bottom: 30px; }
          .section img { max-width: 100%; height: auto; margin-bottom: 15px; }
          h1 { color: #2c3e50; }
          h2 { color: #34495e; }
        </style>
      </head>
      <body>
        <div class="container">
          ${sections.sort((a, b) => a.section_number - b.section_number)
            .map(section => `
              <div class="section">
                <h2>${section.title}</h2>
                ${section.image_url ? `<img src="${section.image_url}" alt="${section.title}">` : ''}
                ${section.content}
              </div>
            `).join('')}
        </div>
      </body>
    </html>
  `;
}

async function sendNewsletterDraft(newsletterId) {
  try {
    // Get newsletter data
    const { data: newsletter } = await supabase
      .from('newsletters')
      .select(`
        *,
        company:companies (
          company_name,
          industry,
          contact_email
        ),
        sections:newsletter_sections (
          section_number,
          title,
          content,
          image_url
        )
      `)
      .eq('id', newsletterId)
      .single();

    if (!newsletter || !newsletter.company || !newsletter.sections) {
      throw new Error('Newsletter data not found');
    }

    // Generate HTML content
    const htmlContent = await generateNewsletterHTML(newsletter.sections);

    // Send email
    await sendBrevoEmail(
      newsletter.company.contact_email,
      newsletter.subject || `${newsletter.company.company_name} Newsletter`,
      htmlContent
    );

    // Update newsletter status
    await supabase
      .from('newsletters')
      .update({ 
        draft_status: 'sent',
        draft_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    console.log(`Draft sent to ${newsletter.company.contact_email}`);
    return true;
  } catch (error) {
    console.error('Error sending newsletter draft:', error);
    throw error;
  }
}

async function processWorkflow() {
  while (true) {
    try {
      // Get pending queue items
      const { data: queueItems } = await supabase
        .from('newsletter_generation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at');

      if (!queueItems || queueItems.length === 0) {
        await sleep(5000);
        continue;
      }

      for (const item of queueItems) {
        try {
          console.log(`Processing queue item: ${item.id} (${item.section_type})`);

          // Update status to in_progress
          await supabase
            .from('newsletter_generation_queue')
            .update({ status: 'in_progress' })
            .eq('id', item.id);

          // Get company data
          const { data: newsletter } = await supabase
            .from('newsletters')
            .select('company_id')
            .eq('id', item.newsletter_id)
            .single();

          const { data: company } = await supabase
            .from('companies')
            .select('company_name, industry, target_audience')
            .eq('id', newsletter.company_id)
            .single();

          // Generate content
          const { title, content } = await generateContent(
            company.company_name,
            company.industry,
            company.target_audience,
            item.section_type
          );

          // Generate image
          const imagePrompt = `Create a modern, professional abstract image representing ${company.industry} concepts. The image should be minimalist and symbolic, focusing on geometric shapes, gradients, or abstract patterns. Do not include any text, letters, numbers, or human figures. Use a professional color palette suitable for ${company.industry}. The image should convey the concept of ${title} through abstract visual elements only, such as flowing lines, interconnected shapes, or dynamic compositions. Make it suitable for a business newsletter background.`;
          const imageUrl = await generateImage(imagePrompt);

          // Update section status
          await supabase
            .from('newsletter_sections')
            .update({ 
              status: 'completed',
              title,
              content,
              image_prompt: imagePrompt,
              image_url: imageUrl,
              updated_at: new Date().toISOString()
            })
            .eq('newsletter_id', item.newsletter_id)
            .eq('section_type', item.section_type);

          // Update queue item status
          await supabase
            .from('newsletter_generation_queue')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          console.log(`Completed queue item: ${item.id}`);

          // Check if all sections are completed
          const { data: sections } = await supabase
            .from('newsletter_sections')
            .select('status')
            .eq('newsletter_id', item.newsletter_id);

          const allCompleted = sections.every(s => s.status === 'completed');
          if (allCompleted) {
            console.log('All sections completed, sending draft...');
            await sendNewsletterDraft(item.newsletter_id);
          }

          // Add delay between sections to respect rate limits
          await sleep(2000);
        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error);

          // Update queue item status
          await supabase
            .from('newsletter_generation_queue')
            .update({ 
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // Update section status
          await supabase
            .from('newsletter_sections')
            .update({ 
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('newsletter_id', item.newsletter_id)
            .eq('section_type', item.section_type);
        }
      }
    } catch (error) {
      console.error('Error in workflow processor:', error);
      await sleep(5000);
    }
  }
}

// Start the workflow processor
console.log('Starting workflow processor...');
processWorkflow().catch(error => {
  console.error('Fatal error in workflow processor:', error);
  process.exit(1);
});
