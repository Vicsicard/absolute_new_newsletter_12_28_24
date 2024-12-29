import OpenAI from 'openai';
import { NewsletterWithCompany, NewsletterSection, Section } from '@/types/email';
import { getSupabaseAdmin } from './supabase-admin';
import { APIError } from './errors';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface GenerateOptions {
  companyName: string;
  industry: string;
  targetAudience?: string;
  audienceDescription?: string;
}

export async function generateNewsletter(
  newsletterId: string,
  customPrompt?: string,
  options?: GenerateOptions
): Promise<NewsletterSection[]> {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    if (!options) {
      // Get company data from newsletter if options not provided
      const { data: newsletter, error: newsletterError } = await supabaseAdmin
        .from('newsletters')
        .select(`
          *,
          company:companies (
            company_name,
            industry,
            target_audience,
            audience_description
          )
        `)
        .eq('id', newsletterId)
        .returns<NewsletterWithCompany>()
        .single();

      if (newsletterError || !newsletter) {
        throw new APIError('Failed to fetch newsletter data', 500);
      }

      options = {
        companyName: newsletter.company.company_name,
        industry: newsletter.company.industry,
        targetAudience: newsletter.company.target_audience || undefined,
        audienceDescription: newsletter.company.audience_description || undefined
      };
    }

    // Generate sections using OpenAI
    const sectionPrompts = [
      customPrompt || "Write about current industry trends and innovations",
      "Provide practical tips and best practices",
      "Share success stories or case studies"
    ];

    const sections: NewsletterSection[] = [];

    for (let i = 0; i < sectionPrompts.length; i++) {
      const prompt = sectionPrompts[i];
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

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new APIError('Failed to generate newsletter content', 500);
      }

      // Extract title and content
      const lines = response.split('\n').filter(line => line.trim());
      const title = lines[0].replace(/^#*\s*/, ''); // Remove any markdown heading symbols
      const content = lines.slice(1).join('\n').trim();

      sections.push({
        newsletter_id: newsletterId,
        section_number: i + 1,
        title,
        content,
        image_prompt: `Create an image for a newsletter section titled "${title}" about ${options.industry}`,
        status: 'active',
      });

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return sections;

  } catch (error) {
    console.error('Error generating newsletter:', error);
    throw error instanceof APIError ? error : new APIError('Failed to generate newsletter', 500);
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
