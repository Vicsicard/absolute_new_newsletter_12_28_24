// Email Types
import type { Database } from './database';

// Base types from database
export type Company = {
  id: string;
  company_name: string;
  industry: string;
  target_audience: string | null;
  audience_description: string | null;
  contact_email: string;
  website_url: string | null;
  phone_number: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Newsletter = {
  id: string;
  company_id: string;
  subject: string;
  draft_status: DraftStatus;
  draft_recipient_email: string | null;
  draft_sent_at: string | null;
  status: NewsletterStatus;
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  last_sent_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type NewsletterSection = {
  id: string;
  newsletter_id: string;
  section_number: number;
  title: string;
  content: string;
  image_prompt: string | null;
  image_url: string | null;
  status: NewsletterSectionStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type Contact = {
  id: string;
  company_id: string;
  email: string;
  name: string | null;
  status: ContactStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type NewsletterContact = {
  id: string;
  newsletter_id: string;
  contact_id: string;
  status: NewsletterContactStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ImageGenerationHistory = {
  id: string;
  newsletter_section_id: string;
  prompt: string;
  image_url: string | null;
  status: ImageGenerationStatus;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CompiledNewsletter = {
  id: string;
  newsletter_id: string;
  html_content: string;
  email_subject: string;
  preview_text: string | null;
  compiled_status: CompiledNewsletterStatus;
  error_message: string | null;
  sent_count: number;
  last_sent_at: string | null;
  public_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CsvUpload = {
  id: string;
  company_id: string;
  file_name: string;
  file_size: number;
  status: CsvUploadStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type IndustryInsight = {
  id: string;
  company_id: string;
  title: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

// Status types - must match database CHECK constraints exactly
export type NewsletterStatus = 'draft' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
export type DraftStatus = 'pending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'deleted';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type NewsletterSectionStatus = 'active' | 'deleted';
export type ImageGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CsvUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CompiledNewsletterStatus = 'draft' | 'ready' | 'sent' | 'error';

// Relationship types
export interface NewsletterWithCompany extends Newsletter {
  company: Company;
}

export interface NewsletterWithSections extends Newsletter {
  newsletter_sections: NewsletterSection[];
}

export interface NewsletterWithAll extends Newsletter {
  company: Company;
  newsletter_sections: NewsletterSection[];
}

// Email specific interfaces
export interface EmailContact {
  email: string;
  name: string | null;
}

export interface BulkEmailResult {
  successful: Array<{
    email: string;
    messageId: string;
    sent_at: string;
  }>;
  failed: Array<{
    email: string;
    error: string;
    error_message: string;
  }>;
}

export interface NewsletterEmailData {
  subject: string;
  sections: Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>;
}

export interface EmailApiResponse {
  success: boolean;
  message: string;
  data?: {
    messageId?: string;
    results?: BulkEmailResult;
  };
  error?: {
    type: string;
    message: string;
  };
}
