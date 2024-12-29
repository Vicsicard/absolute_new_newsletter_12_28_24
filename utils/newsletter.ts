import OpenAI from 'openai'
import { Database } from '@/types/supabase'
import { supabaseAdmin } from './supabase-admin'
import { DatabaseError } from './errors'

const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

if (!process.env.BREVO_API_KEY) {
  throw new Error('Missing BREVO_API_KEY environment variable')
}

type DbNewsletterSection = Database['public']['Tables']['newsletter_sections']['Row']

export interface NewsletterSection {
  id?: string
  newsletter_id?: string
  section_number: number
  title: string
  content: string
  image_prompt?: string
  image_url?: string
  created_at?: string
  updated_at?: string
}

// Add delay utility function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateNewsletter(newsletterId: string): Promise<NewsletterSection[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const { data: newsletter, error: newsletterError } = await supabaseAdmin
    .from('newsletters')
    .select('*, company:companies(*)')
    .eq('id', newsletterId)
    .single()

  if (newsletterError) {
    throw new DatabaseError('Failed to fetch newsletter')
  }

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  // Add 15 second delay before content generation
  await delay(15000);

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional content creator specializing in crafting engaging, polished newsletters for businesses. Your goal is to create a high-quality, industry-specific newsletter broken into three standalone sections.

Format each section EXACTLY like this:
# [Section Title]
Content:
[Section content following this structure:
- Headline
- Introduction (one paragraph)
- Why It Matters (with bullet points)
- The Solution
- The Takeaway (with call to action)]
Image Prompt:
[A detailed visual description for DALL-E to generate an image that matches the section's theme]

Create these three sections:
1. Pain Point Analysis: Addressing a critical industry pain point
2. Common Mistakes: Identifying frequent industry mistakes
3. Company Solutions: Presenting your company's solutions and benefits

Use the following company information:
Company Name: ${newsletter.company.company_name}
Industry: ${newsletter.company.industry}
Target Audience: ${newsletter.company.target_audience || 'Industry professionals'}
Audience Description: ${newsletter.company.audience_description || 'Businesses in the industry'}`
      },
      {
        role: "user",
        content: "Generate the three newsletter sections now, following the exact format specified."
      }
    ],
    temperature: 0.7,
    max_tokens: 2500
  })

  const generatedContent = completion.choices[0].message.content
  if (!generatedContent) {
    throw new Error('Failed to generate newsletter content')
  }

  console.log('Generated content:', generatedContent);

  const sections = parseNewsletterContent(generatedContent)

  // Generate images for each section with delays between requests
  for (const section of sections) {
    if (section.image_prompt) {
      try {
        // Add 30 second delay before each image generation
        await delay(30000);
        
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: section.image_prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });

        if (imageResponse.data && imageResponse.data[0]?.url) {
          section.image_url = imageResponse.data[0].url;
        }
      } catch (error) {
        console.error('Error generating image:', error);
        // Add extra delay if there was an error before continuing
        await delay(45000);
      }
    }
  }

  return sections
}

export function parseNewsletterSection(sectionText?: string): NewsletterSection | null {
  if (!sectionText) return null
  
  // Clean up the text and split into lines
  const lines = sectionText.trim().split('\n').map(line => line.trim()).filter(line => line)
  if (lines.length === 0) return null

  // Extract title (with or without #)
  const title = lines[0].startsWith('# ') ? lines[0].substring(2) : lines[0]
  
  // Find content and image prompt sections
  const contentStart = lines.findIndex(line => line.toLowerCase().startsWith('content:'))
  const imagePromptStart = lines.findIndex(line => line.toLowerCase().startsWith('image prompt:'))
  
  if (contentStart === -1) return null // Content section is required

  // Extract content
  const contentEndIndex = imagePromptStart !== -1 ? imagePromptStart : lines.length
  const contentLines = lines.slice(contentStart + 1, contentEndIndex)
  const content = contentLines.join('\n').trim()
  
  if (!content) return null // Empty content is not valid

  const section: Partial<NewsletterSection> = {
    title: title.trim(),
    content: content,
  }

  // Look for image prompt
  if (imagePromptStart !== -1 && imagePromptStart + 1 < lines.length) {
    const imagePrompt = lines.slice(imagePromptStart + 1).join(' ').trim()
    if (imagePrompt) {
      section.image_prompt = imagePrompt
    }
  }

  return section as NewsletterSection;
}

export function parseNewsletterContent(text: string): NewsletterSection[] {
  // Split by double newline or section marker
  const sectionTexts = text.split(/\n\n(?=# )/)
  console.log('Split sections:', sectionTexts)
  
  const sections = sectionTexts
    .map(section => parseNewsletterSection(section))
    .filter((section): section is NewsletterSection => section !== null)
  
  console.log('Parsed sections:', sections)
  return sections
}

export async function sendNewsletter(
  to: { email: string }[],
  subject: string,
  htmlContent: string,
  from = { email: process.env.BREVO_SENDER_EMAIL || 'newsletter@example.com', name: process.env.BREVO_SENDER_NAME || 'Newsletter Service' }
) {
  console.log('Sending newsletter with:', {
    to,
    subject,
    from,
    apiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing'
  });

  const requestBody = {
    sender: from,
    to,
    subject,
    htmlContent,
  };
  
  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(BREVO_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Brevo API error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return response.json();
}

export function validateEmailList(emails: string[]) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.every(email => emailRegex.test(email))
}

export function formatNewsletterHtml(content: string) {
  // Convert markdown-like content to HTML
  let html = content
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) {
        return `<h1>${line.replace('# ', '')}</h1>`
      }
      if (line.startsWith('## ')) {
        return `<h2>${line.replace('## ', '')}</h2>`
      }
      if (line.startsWith('### ')) {
        return `<h3>${line.replace('### ', '')}</h3>`
      }
      return `<p>${line}</p>`
    })
    .join('\n')

  // Add some basic styling
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${html}
    </div>
  `
}
