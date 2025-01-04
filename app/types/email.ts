// Company type
export interface Company {
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

// Contact type
export interface Contact {
  id: string;
  company_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
}

// Newsletter type
export interface Newsletter {
  id: string;
  company_id: string;
  subject: string;
  status: NewsletterStatus;
  draft_status: DraftStatus;
  draft_recipient_email?: string;
  created_at: string;
  updated_at: string;
}

// Newsletter Section type
export interface NewsletterSection {
  id: string;
  newsletter_id: string;
  section_number: number;
  section_type: SectionType;
  title?: string;
  content?: string;
  status: NewsletterSectionStatus;
  created_at: string;
  updated_at: string;
}

// Newsletter Contact type
export interface NewsletterContact {
  id: string;
  newsletter_id: string;
  contact_id: string;
  status: NewsletterContactStatus;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Image Generation History type
export interface ImageGenerationHistory {
  id: string;
  newsletter_section_id: string;
  prompt: string;
  image_url?: string;
  status: ImageGenerationStatus;
  created_at: string;
  updated_at: string;
}

// Industry Insights type
export interface IndustryInsight {
  id: string;
  company_id: string;
  industry: string;
  insight: string;
  created_at: string;
  updated_at: string;
}

// CSV Upload type
export interface CsvUpload {
  id: string;
  company_id: string;
  filename: string;
  status: CsvUploadStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Compiled Newsletter type
export interface CompiledNewsletter {
  id: string;
  newsletter_id: string;
  html_content: string;
  compiled_status: CompiledNewsletterStatus;
  created_at: string;
  updated_at: string;
}

// Newsletter Generation Queue type
export interface NewsletterGenerationQueue {
  id: string;
  newsletter_id: string;
  section_type: SectionType;
  section_number: number;
  status: QueueStatus;
  attempts: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Status types
export type NewsletterStatus = 'draft' | 'published' | 'archived';
export type DraftStatus = 'draft' | 'draft_sent' | 'pending_contacts' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'inactive' | 'unsubscribed';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type NewsletterSectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type ImageGenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type CsvUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CompiledNewsletterStatus = 'draft' | 'ready' | 'sent' | 'error';
export type QueueStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type SectionType = 'welcome' | 'industry_trends' | 'practical_tips';
