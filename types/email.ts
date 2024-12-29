// Email Types
import type { Database } from '@/types/database';

// Re-export database types
export type Company = Database['public']['Tables']['companies']['Row'];
export type Newsletter = Database['public']['Tables']['newsletters']['Row'];
export type NewsletterSection = Database['public']['Tables']['newsletter_sections']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];

// Status types
export type NewsletterStatus = 'draft' | 'sending' | 'sent' | 'failed';
export type DraftStatus = 'pending' | 'sent' | 'failed';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'inactive' | 'unsubscribed';
export type NewsletterSectionStatus = 'active' | 'inactive';
export type ImageGenerationStatus = 'pending' | 'completed' | 'failed';

// Email specific interfaces
export interface EmailContact {
  email: string;
  name?: string | null;
}

export interface BulkEmailResult {
  successful: Array<{
    email: string;
    messageId: string;
  }>;
  failed: Array<{
    email: string;
    error: string;
  }>;
}

export interface NewsletterEmailData {
  subject: string;
  sections: Array<NewsletterSection>;
  contacts: Array<{
    newsletterContactId: string;
    contact: Contact;
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
