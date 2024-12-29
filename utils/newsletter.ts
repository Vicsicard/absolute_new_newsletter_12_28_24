import OpenAI from 'openai';
import { Database } from '@/types/supabase';
import { getSupabaseAdmin } from './supabase-admin';
import { APIError } from './errors';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type DbNewsletterSection = Database['public']['Tables']['newsletter_sections']['Row'];

export interface NewsletterSection {
  id?: string;
  newsletter_id?: string;
  section_number: number;
  title: string;
  content: string;
  image_prompt?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Add delay utility function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface GenerateOptions {
  companyName: string;
  industry: string;
  targetAudience?: string;
  audienceDescription?: string;
}

interface Section {
  title: string;
  content: string;
  image_prompt?: string;
  image_url?: string;
}

export async function generateNewsletter(
  newsletterId: string,
  customPrompt?: string,
  options?: GenerateOptions
): Promise<Section[]> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    if (!options) {
      // Get company data from newsletter if options not provided
      const { data: newsletter, error: newsletterError } = await supabaseAdmin
        .from('newsletters')
        .select(`
          companies (
            company_name,
            industry,
            target_audience,
            audience_description
          )
        `)
        .eq('id', newsletterId)
        .single();

      if (newsletterError || !newsletter || !newsletter.companies) {
        throw new APIError('Failed to fetch newsletter data', 500);
      }

      options = {
        companyName: newsletter.companies.company_name,
        industry: newsletter.companies.industry,
        targetAudience: newsletter.companies.target_audience || undefined,
        audienceDescription: newsletter.companies.audience_description || undefined
      };
    }

    // Generate sections using OpenAI
    const sectionPrompts = [
      customPrompt || "Write about current industry trends and innovations",
      "Provide practical tips and best practices",
      "Share success stories or case studies"
    ];

    const sections: Section[] = [];

    for (const prompt of sectionPrompts) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a professional newsletter writer specializing in business content."
        }, {
          role: "user",
          content: `${prompt} for ${options.companyName}, a ${options.industry} company targeting ${options.targetAudience || 'general audience'}. 
          Make it engaging and actionable. Include a title for this section.`
        }]
      });

      const content = completion.choices[0].message.content || '';
      const [title, ...contentParts] = content.split('\n').filter(Boolean);

      // Generate image prompt
      const imagePromptCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an expert at creating prompts for DALL-E 3 to generate ultra-realistic photographic images. Create prompts that result in high-quality, photorealistic imagery that looks like it was taken with a professional camera. Focus on objects, environments, and abstract concepts. IMPORTANT RULES: 1) NEVER include people in the images 2) NEVER include any text or writing 3) Always maintain photographic realism - images should look like they were captured by a professional photographer 4) Use natural lighting and professional photography techniques in the descriptions."
        }, {
          role: "user",
          content: `Create a DALL-E 3 prompt for an ultra-realistic photograph that represents: "${title}" for a ${options.industry} company targeting ${options.targetAudience || 'general audience'}.
            The image must be photorealistic like a professional photograph, without any people or text.
            Focus on objects, environments, or abstract concepts that symbolize the theme.
            Use professional photography terms (depth of field, lighting, composition).
            Make it specific and detailed but keep it under 200 characters.`
        }]
      });

      const image_prompt = imagePromptCompletion.choices[0].message.content || '';

      try {
        const imageResponse = await openai.images.generate({
          prompt: image_prompt,
          n: 1,
          size: "1024x1024",
        });

        sections.push({
          title: title.replace(/^#+ /, ''), // Remove Markdown headers if present
          content: contentParts.join('\n'),
          image_prompt,
          image_url: imageResponse.data[0]?.url
        });
      } catch (imageError) {
        console.error('Image generation error:', imageError);
        sections.push({
          title: title.replace(/^#+ /, ''),
          content: contentParts.join('\n'),
          image_prompt,
          image_url: undefined
        });
      }
    }

    return sections;
  } catch (error) {
    console.error('Error generating newsletter:', error);
    throw error instanceof Error ? error : new Error('Failed to generate newsletter');
  }
}

export function validateEmailList(emails: string[]) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every(email => emailRegex.test(email));
}

export function formatNewsletterHtml(content: string) {
  // Convert markdown-like content to HTML
  let html = content
    .split('\n')
    .map(line => {
      // Headers
      if (line.startsWith('# ')) {
        return `<h1>${line.slice(2)}</h1>`;
      }
      if (line.startsWith('## ')) {
        return `<h2>${line.slice(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3>${line.slice(4)}</h3>`;
      }
      
      // Lists
      if (line.startsWith('- ')) {
        return `<li>${line.slice(2)}</li>`;
      }
      
      // Paragraphs
      if (line.trim()) {
        return `<p>${line}</p>`;
      }
      
      return '';
    })
    .join('\n');

  // Wrap lists in <ul> tags
  html = html.replace(/<li>.*?<\/li>/g, match => `<ul>${match}</ul>`);
  
  return html;
}
