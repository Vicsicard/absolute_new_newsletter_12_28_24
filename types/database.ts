export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type NewsletterStatus = 'draft' | 'draft_sent' | 'pending_contacts' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
export type DraftStatus = 'pending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'deleted';
export type NewsletterContactStatus = 'pending' | 'sent' | 'failed';
export type NewsletterSectionStatus = 'active' | 'deleted';
export type ImageGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
          name: string | null;
          status: ContactStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          name?: string | null;
          status?: ContactStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          name?: string | null;
          status?: ContactStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      csv_uploads: {
        Row: {
          id: string;
          company_id: string;
          filename: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          processed_rows: number;
          total_rows: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          filename: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          processed_rows?: number;
          total_rows?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          filename?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          processed_rows?: number;
          total_rows?: number;
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
          error_message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_section_id: string;
          prompt: string;
          image_url?: string | null;
          status?: ImageGenerationStatus;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_section_id?: string;
          prompt?: string;
          image_url?: string | null;
          status?: ImageGenerationStatus;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      industry_insights: {
        Row: {
          id: string;
          company_id: string;
          industry: string;
          insight_type: string;
          content: string;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          industry: string;
          insight_type: string;
          content: string;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          industry?: string;
          insight_type?: string;
          content?: string;
          metadata?: Json | null;
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
          error_message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          contact_id: string;
          status?: NewsletterContactStatus;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          contact_id?: string;
          status?: NewsletterContactStatus;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletter_sections: {
        Row: {
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
        Insert: {
          id?: string;
          newsletter_id: string;
          section_number: number;
          title: string;
          content: string;
          image_prompt?: string | null;
          image_url?: string | null;
          status?: NewsletterSectionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          section_number?: number;
          title?: string;
          content?: string;
          image_prompt?: string | null;
          image_url?: string | null;
          status?: NewsletterSectionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      newsletters: {
        Row: {
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
        Insert: {
          id?: string;
          company_id: string;
          subject: string;
          draft_status?: DraftStatus;
          draft_recipient_email?: string | null;
          draft_sent_at?: string | null;
          status?: NewsletterStatus;
          sent_at?: string | null;
          sent_count?: number;
          failed_count?: number;
          last_sent_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          subject?: string;
          draft_status?: DraftStatus;
          draft_recipient_email?: string | null;
          draft_sent_at?: string | null;
          status?: NewsletterStatus;
          sent_at?: string | null;
          sent_count?: number;
          failed_count?: number;
          last_sent_status?: string | null;
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
