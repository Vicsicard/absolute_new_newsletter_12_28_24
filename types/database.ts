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
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletters: {
        Row: {
          id: string;
          company_id: string;
          subject: string;
          industry_summary: string | null;
          section1_content: string | null;
          section2_content: string | null;
          section3_content: string | null;
          created_at?: string;
          updated_at?: string;
          companies?: Database['public']['Tables']['companies']['Row'];
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
          created_at?: string;
          updated_at?: string;
        };
      };
      compiled_newsletters: {
        Row: {
          id: string;
          newsletter_id: string;
          compiled_status: string;
          compiled_content: string | null;
          error_message: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
