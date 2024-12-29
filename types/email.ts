// Email Types
import type { Database } from '@/types/database';

// Base types from database
export type Company = Database['public']['Tables']['companies']['Row'];
export type Newsletter = Database['public']['Tables']['newsletters']['Row'];
export type NewsletterSection = Omit<Database['public']['Tables']['newsletter_sections']['Row'], 'id'> & { id?: string };
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];
export type ImageGenerationHistory = Database['public']['Tables']['image_generation_history']['Row'];
export type CsvUpload = Database['public']['Tables']['csv_uploads']['Row'];
export type IndustryInsight = Database['public']['Tables']['industry_insights']['Row'];

// Status types - must match database CHECK constraints
export type NewsletterStatus = 'draft' | 'draft_sent' | 'pending_contacts' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
export type DraftStatus = 'pending' | 'sent' | 'failed';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'deleted';
export type NewsletterSectionStatus = 'active' | 'deleted';
export type ImageGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CsvUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Relationship types
export interface NewsletterWithCompany extends Newsletter {
  company: Pick<Company, 'company_name' | 'industry' | 'target_audience' | 'audience_description' | 'contact_email'>;
}

export interface NewsletterWithRelations extends Newsletter {
  company: Pick<Company, 'company_name' | 'industry' | 'target_audience' | 'audience_description' | 'contact_email'>;
  newsletter_sections: NewsletterSection[];
}

// Email specific interfaces
export interface EmailContact {
  email: string;
  name?: string | null;
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
