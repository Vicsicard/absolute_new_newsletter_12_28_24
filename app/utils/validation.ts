import { FormErrors } from '@/types/form';

export function validateForm(formData: FormData): FormErrors {
  const errors: FormErrors = {};
  
  // Company Name validation
  const companyName = formData.get('company_name') as string;
  if (!companyName) {
    errors.company_name = 'Company name is required';
  } else if (companyName.length < 2) {
    errors.company_name = 'Company name must be at least 2 characters long';
  } else if (companyName.length > 100) {
    errors.company_name = 'Company name must be less than 100 characters';
  }

  // Industry validation
  const industry = formData.get('industry') as string;
  if (!industry) {
    errors.industry = 'Industry is required';
  } else if (industry.length < 2) {
    errors.industry = 'Industry must be at least 2 characters long';
  } else if (industry.length > 50) {
    errors.industry = 'Industry must be less than 50 characters';
  }

  // Email validation
  const email = formData.get('contact_email') as string;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.contact_email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.contact_email = 'Please enter a valid email address';
  }

  // Website URL validation (optional)
  const websiteUrl = formData.get('website_url') as string;
  if (websiteUrl) {
    try {
      new URL(websiteUrl);
    } catch {
      errors.website_url = 'Please enter a valid URL (e.g., https://example.com)';
    }
  }

  // Target Audience validation (optional)
  const targetAudience = formData.get('target_audience') as string;
  if (targetAudience && targetAudience.length > 100) {
    errors.target_audience = 'Target audience description must be less than 100 characters';
  }

  // Audience Description validation (optional)
  const audienceDescription = formData.get('audience_description') as string;
  if (audienceDescription && audienceDescription.length > 500) {
    errors.audience_description = 'Audience description must be less than 500 characters';
  }

  // Phone Number validation (optional)
  const phoneNumber = formData.get('phone_number') as string;
  if (phoneNumber) {
    const phoneRegex = /^\+?[\d\s-()]{10,20}$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.phone_number = 'Please enter a valid phone number';
    }
  }

  return errors;
}
