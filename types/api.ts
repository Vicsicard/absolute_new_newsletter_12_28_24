// API Types
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  data?: {
    company_id: string;
    newsletter_id: string;
    total_contacts: number;
  };
}

export interface NewsletterGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    newsletter_id: string;
    draft_sent: boolean;
    email_sent_to: string;
  };
}

export interface NewsletterSendResponse {
  success: boolean;
  message: string;
  data?: {
    newsletter_id: string;
    total_recipients: number;
    sent_at: string;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}

// HTTP Types
export interface HttpHeaders {
  [key: string]: string;
}
