import type { Company, Newsletter } from './email';

export interface OnboardingResponse {
  success: boolean;
  company?: Company;
  newsletter?: Newsletter;
  message?: string;
  error?: string;
}

export interface QueueResponse {
  success: boolean;
  message?: string;
  error?: string;
}
