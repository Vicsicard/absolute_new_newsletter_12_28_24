import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type NewsletterSection = Database['public']['Tables']['newsletter_sections']['Row']

export interface NewsletterSectionInput {
  title: string
  content: string
  image_prompt?: string
  image_url?: string
}

export const parseNewsletterSection = (text?: string): NewsletterSectionInput | null => {
  if (!text) return null
  const lines = text.split('\n')
  const title = lines[0].replace('# ', '')
  const contentStart = lines.findIndex(line => line.startsWith('Content: '))
  const imagePromptStart = lines.findIndex(line => line.startsWith('Image Prompt: '))
  
  if (contentStart === -1) return null

  const contentLines = lines.slice(contentStart + 1, imagePromptStart !== -1 ? imagePromptStart : undefined)
  const content = contentLines.join('\n').trim()
  
  const section: NewsletterSectionInput = {
    title,
    content,
  }

  if (imagePromptStart !== -1) {
    section.image_prompt = lines[imagePromptStart].replace('Image Prompt: ', '').trim()
  }

  return section
}

export const parseNewsletterContent = (content: string): NewsletterSectionInput[] => {
  const sections = content.split('\n\n')
  return sections
    .map(section => parseNewsletterSection(section))
    .filter((section): section is NewsletterSectionInput => section !== null)
}

export const formatNewsletterHtml = (content: string) => {
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

export const validateEmailList = (emails: string[]) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.every(email => emailRegex.test(email))
}
