// Email Types
import { Database } from './database';

type Contact = Database['public']['Tables']['contacts']['Row'];
type NewsletterContact = Database['public']['Tables']['newsletter_contacts']['Row'];
type Newsletter = Database['public']['Tables']['newsletters']['Row'];
type NewsletterSection = Database['public']['Tables']['newsletter_sections']['Row'];

// Re-export types from database for convenience
export type { 
  NewsletterStatus,
  DraftStatus,
  NewsletterContactStatus,
  ContactStatus,
  NewsletterSectionStatus,
  ImageGenerationStatus 
} from './database';

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

export interface NewsletterEmailData {
  subject: string;
  sections: Array<NewsletterSection>;
  contacts: Array<{
    newsletterContactId: string;
    contact: Contact;
  }>;
}

export interface NewsletterSendResult extends BulkEmailResult {
  newsletterId: string;
  totalSent: number;
  totalFailed: number;
  updatedContacts: NewsletterContact[];
}
