export interface FormErrors {
  company_name?: string;
  industry?: string;
  contact_email?: string;
  website_url?: string;
  target_audience?: string;
  audience_description?: string;
  phone_number?: string;
  [key: string]: string | undefined;
}
