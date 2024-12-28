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
          name: string
          description: string
          industry: string
          tone: string
          target_audience: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          industry: string
          tone: string
          target_audience: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          industry?: string
          tone?: string
          target_audience?: string
        }
      }
      newsletters: {
        Row: {
          id: string
          created_at: string
          company_id: string
          subject: string
          content: string
          status: 'draft' | 'sent'
          sent_at: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          subject: string
          content: string
          status?: 'draft' | 'sent'
          sent_at?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          subject?: string
          content?: string
          status?: 'draft' | 'sent'
          sent_at?: string | null
          image_url?: string | null
        }
      }
      subscribers: {
        Row: {
          id: string
          created_at: string
          email: string
          company_id: string
          status: 'active' | 'unsubscribed'
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          company_id: string
          status?: 'active' | 'unsubscribed'
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          company_id?: string
          status?: 'active' | 'unsubscribed'
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
