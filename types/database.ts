export type NewsletterStatus = 'draft' | 'pending' | 'sending' | 'sent' | 'failed';
export type DraftStatus = 'pending' | 'sent' | 'failed';
export type ContactStatus = 'active' | 'inactive' | 'deleted';
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
          created_at: string;
          updated_at: string;
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
          created_at: string;
          updated_at: string;
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
          created_at: string;
          updated_at: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          name: string | null;
          status: ContactStatus;
          created_at: string;
          updated_at: string;
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
          created_at: string;
          updated_at: string;
        };
      };
      image_generation_history: {
        Row: {
          id: string;
          newsletter_section_id: string;
          prompt: string;
          model: string;
          image_url: string | null;
          error_message: string | null;
          status: ImageGenerationStatus;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
