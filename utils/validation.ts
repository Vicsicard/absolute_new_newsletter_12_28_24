import { FormErrors } from '@/types/form'

export const validateForm = (email: string): FormErrors => {
  const errors: FormErrors = {}

  if (!email) {
    errors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Please enter a valid email address'
  }

  return errors
}
