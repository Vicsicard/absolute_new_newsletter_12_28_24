export type NewsletterStatus = 'draft' | 'draft_sent' | 'pending_contacts' | 'ready_to_send' | 'sending' | 'sent' | 'failed';

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
          logo_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      newsletters: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          content: string | null;
          industry_info: any | null;  
          industry_summary: string | null;
          section1_content: string | null;
          section2_content: string | null;
          section3_content: string | null;
          created_at: string;
          updated_at: string;
          status: string;
          sent_at: string | null;
          sent_count: number;
          failed_count: number;
          last_sent_status: string | null;
          newsletter_objectives: string | null;
          primary_cta: string | null;
          draft_sent_at: string | null;
          draft_recipient_email: string | null;
          draft_status: string;
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
          status: string;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          name: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      newsletter_contacts: {
        Row: {
          id: string;
          newsletter_id: string;
          contact_id: string;
          status: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      csv_uploads: {
        Row: {
          id: string;
          company_id: string;
          filename: string;
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      image_generation_history: {
        Row: {
          id: string;
          newsletter_section_id: string;
          prompt: string;
          image_url: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      compiled_newsletters: {
        Row: {
          id: string;
          newsletter_id: string;
          compiled_status: string;
          compiled_content: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
      industry_insights: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          version: number;
        };
      };
    };
  };
}
