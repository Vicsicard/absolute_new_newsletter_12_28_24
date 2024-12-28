export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          created_at: string
          company_name: string
          industry: string
          contact_email: string
          website_url?: string
          phone_number?: string
          target_audience?: string
        }
        Insert: {
          id?: string
          created_at?: string
          company_name: string
          industry: string
          contact_email: string
          website_url?: string
          phone_number?: string
          target_audience?: string
        }
        Update: {
          id?: string
          created_at?: string
          company_name?: string
          industry?: string
          contact_email?: string
          website_url?: string
          phone_number?: string
          target_audience?: string
        }
      }
      newsletters: {
        Row: {
          id: string
          created_at: string
          company_id: string
          title: string
          content: string
          subject: string
          status: 'draft' | 'sent' | 'failed'
          sent_at?: string
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          title: string
          content?: string
          subject?: string
          status?: 'draft' | 'sent' | 'failed'
          sent_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          title?: string
          content?: string
          subject?: string
          status?: 'draft' | 'sent' | 'failed'
          sent_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          company_id: string
          email: string
          name?: string
          status: 'active' | 'unsubscribed' | 'bounced'
          unsubscribed_at?: string
          last_sent_at?: string
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          email: string
          name?: string
          status?: 'active' | 'unsubscribed' | 'bounced'
          unsubscribed_at?: string
          last_sent_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          email?: string
          name?: string
          status?: 'active' | 'unsubscribed' | 'bounced'
          unsubscribed_at?: string
          last_sent_at?: string
        }
      }
      newsletter_contacts: {
        Row: {
          id: string
          created_at: string
          newsletter_id: string
          contact_id: string
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at?: string
          error_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          newsletter_id: string
          contact_id: string
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at?: string
          error_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          newsletter_id?: string
          contact_id?: string
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          sent_at?: string
          error_message?: string
        }
      }
      newsletter_sections: {
        Row: {
          id: string
          created_at: string
          newsletter_id: string
          section_number: number
          title: string
          content: string
          image_url?: string
          status: 'draft' | 'ready' | 'generating'
        }
        Insert: {
          id?: string
          created_at?: string
          newsletter_id: string
          section_number: number
          title: string
          content: string
          image_url?: string
          status?: 'draft' | 'ready' | 'generating'
        }
        Update: {
          id?: string
          created_at?: string
          newsletter_id?: string
          section_number?: number
          title?: string
          content?: string
          image_url?: string
          status?: 'draft' | 'ready' | 'generating'
        }
      }
      compiled_newsletters: {
        Row: {
          id: string
          created_at: string
          newsletter_id: string
          compiled_content: string
          compiled_status: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          newsletter_id: string
          compiled_content: string
          compiled_status?: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          newsletter_id?: string
          compiled_content?: string
          compiled_status?: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
      }
      csv_uploads: {
        Row: {
          id: string
          created_at: string
          company_id: string
          filename: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
          total_rows?: number
          processed_rows?: number
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          filename: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
          total_rows?: number
          processed_rows?: number
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          filename?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string
          total_rows?: number
          processed_rows?: number
        }
      }
      image_generation_history: {
        Row: {
          id: string
          created_at: string
          newsletter_section_id: string
          prompt: string
          image_url?: string
          status: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          newsletter_section_id: string
          prompt: string
          image_url?: string
          status?: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          newsletter_section_id?: string
          prompt?: string
          image_url?: string
          status?: 'pending' | 'completed' | 'failed'
          error_message?: string
        }
      }
      industry_insights: {
        Row: {
          id: string
          created_at: string
          industry: string
          content: string
          source_url?: string
          published_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          industry: string
          content: string
          source_url?: string
          published_at: string
        }
        Update: {
          id?: string
          created_at?: string
          industry?: string
          content?: string
          source_url?: string
          published_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
