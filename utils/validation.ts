import { FormErrors } from '@/types/form'

export const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {}

  // Required fields
  const requiredFields = {
    company_name: 'Company name',
    industry: 'Industry',
    contact_email: 'Contact email',
    target_audience: 'Target audience'
  }

  // Validate required fields
  for (const [field, label] of Object.entries(requiredFields)) {
    const value = formData.get(field) as string
    if (!value || value.trim() === '') {
      errors[field] = `${label} is required`
    }
  }

  // Validate email format
  const email = formData.get('contact_email') as string
  if (email && !/\S+@\S+\.\S+/.test(email)) {
    errors.contact_email = 'Please enter a valid email address'
  }

  // Validate website URL if provided
  const websiteUrl = formData.get('website_url') as string
  if (websiteUrl && !websiteUrl.startsWith('http')) {
    errors.website_url = 'Please enter a valid URL starting with http:// or https://'
  }

  return errors
}
