'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { validateForm } from '@/utils/validation';
import LoadingModal from '@/components/LoadingModal';
import SuccessModal from '@/components/SuccessModal';
import ErrorModal from '@/components/ErrorModal';
import { FormErrors } from '@/types/form';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset all states
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFormErrors({});

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      console.log('Form data before validation:', Object.fromEntries(formData));

      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsLoading(false);
        throw new Error('Please fix the form errors');
      }

      console.log('Sending request to /api/onboarding...');
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit form');
      }

      const formDataObj = Object.fromEntries(formData);
      const contactEmail = formDataObj.contact_email as string;
      setSuccess(`Newsletter setup completed! Your draft newsletter will be emailed to ${contactEmail} within 24 hours. Please check your spam folder if you don't see it in your inbox.`);
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Newsletter Setup</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.company_name && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">Website URL</label>
                    <input
                      type="url"
                      name="website_url"
                      id="website_url"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.website_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.website_url && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.website_url}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      name="contact_email"
                      id="contact_email"
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.contact_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.contact_email && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.contact_email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      id="phone_number"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.phone_number && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.phone_number}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      id="industry"
                      required
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.industry ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.industry && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.industry}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">Target Audience</label>
                    <input
                      type="text"
                      name="target_audience"
                      id="target_audience"
                      required
                      placeholder="e.g., Small Business Owners, Marketing Professionals"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.target_audience ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.target_audience && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.target_audience}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="audience_description" className="block text-sm font-medium text-gray-700">Audience Description</label>
                    <textarea
                      name="audience_description"
                      id="audience_description"
                      required
                      rows={3}
                      placeholder="Describe your target audience in detail..."
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.audience_description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.audience_description && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.audience_description}</p>
                    )}
                  </div>

                  <div className="pt-5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Processing...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <LoadingModal 
          isOpen={true}
          message="Processing your request..."
          onClose={() => setIsLoading(false)}
        />
      )}
      
      {error && !isLoading && (
        <ErrorModal 
          isOpen={true}
          error={error}
          onClose={handleCloseModal}
        />
      )}

      {success && !isLoading && !error && (
        <SuccessModal 
          isOpen={true}
          message={success}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
