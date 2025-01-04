export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// These must match database CHECK constraints exactly
export type NewsletterDraftStatus = 'draft' | 'draft_sent' | 'pending_contacts' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
export type NewsletterStatus = 'draft' | 'published' | 'archived';
export type ContactStatus = 'active' | 'deleted';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type NewsletterSectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type SectionType = 'welcome' | 'industry_trends' | 'practical_tips';
export type ImageGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CsvUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CompiledNewsletterStatus = 'draft' | 'ready' | 'sent' | 'error';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
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
        Insert: {
          id?: string;
          company_name: string;
          industry: string;
          target_audience?: string | null;
          audience_description?: string | null;
          contact_email: string;
          website_url?: string | null;
          phone_number?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          industry?: string;
          target_audience?: string | null;
          audience_description?: string | null;
          contact_email?: string;
          website_url?: string | null;
          phone_number?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          status: ContactStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          status?: ContactStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          status?: ContactStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletters: {
        Row: {
          id: string;
          company_id: string;
          subject: string;
          status: NewsletterStatus;
          draft_status: NewsletterDraftStatus;
          draft_recipient_email: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          subject: string;
          status?: NewsletterStatus;
          draft_status?: NewsletterDraftStatus;
          draft_recipient_email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          subject?: string;
          status?: NewsletterStatus;
          draft_status?: NewsletterDraftStatus;
          draft_recipient_email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletter_sections: {
        Row: {
          id: string;
          newsletter_id: string;
          section_number: number;
          section_type: SectionType;
          title: string | null;
          content: string | null;
          status: NewsletterSectionStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          section_number: number;
          section_type: SectionType;
          title?: string | null;
          content?: string | null;
          status?: NewsletterSectionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          section_number?: number;
          section_type?: SectionType;
          title?: string | null;
          content?: string | null;
          status?: NewsletterSectionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletter_contacts: {
        Row: {
          id: string;
          newsletter_id: string;
          contact_id: string;
          status: NewsletterContactStatus;
          sent_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          contact_id: string;
          status?: NewsletterContactStatus;
          sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          contact_id?: string;
          status?: NewsletterContactStatus;
          sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      image_generation_history: {
        Row: {
          id: string;
          newsletter_section_id: string;
          prompt: string;
          image_url: string | null;
          status: ImageGenerationStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_section_id: string;
          prompt: string;
          image_url?: string | null;
          status?: ImageGenerationStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_section_id?: string;
          prompt?: string;
          image_url?: string | null;
          status?: ImageGenerationStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      industry_insights: {
        Row: {
          id: string;
          company_id: string;
          industry: string;
          insight: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          industry: string;
          insight: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          industry?: string;
          insight?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      csv_uploads: {
        Row: {
          id: string;
          company_id: string;
          filename: string;
          status: CsvUploadStatus;
          error_message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          filename: string;
          status?: CsvUploadStatus;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          filename?: string;
          status?: CsvUploadStatus;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      compiled_newsletters: {
        Row: {
          id: string;
          newsletter_id: string;
          html_content: string;
          compiled_status: CompiledNewsletterStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          html_content: string;
          compiled_status?: CompiledNewsletterStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          html_content?: string;
          compiled_status?: CompiledNewsletterStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletter_generation_queue: {
        Row: {
          id: string;
          newsletter_id: string;
          section_type: string;
          section_number: number;
          status: NewsletterSectionStatus;
          attempts: number;
          error_message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          section_type: string;
          section_number: number;
          status?: NewsletterSectionStatus;
          attempts?: number;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          section_type?: string;
          section_number?: number;
          status?: NewsletterSectionStatus;
          attempts?: number;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
