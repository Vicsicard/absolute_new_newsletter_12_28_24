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
    <div className="min-h-screen bg-[#3366FF] py-6 flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          AI-Powered Newsletter Generator
        </h1>
        <p className="text-2xl text-white/90">
          Create personalized newsletters with advanced AI technology
        </p>
      </div>
      
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow-2xl rounded-2xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Newsletter Setup</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      required
                      placeholder="Enter your company name"
                      className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 ${
                        formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.company_name && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.company_name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      name="website_url"
                      id="website_url"
                      placeholder="https://your-company.com"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      id="industry"
                      required
                      placeholder="Your industry"
                      className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 ${
                        formErrors.industry ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.industry && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.industry}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="contact_email"
                      id="contact_email"
                      required
                      placeholder="your@email.com"
                      className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 ${
                        formErrors.contact_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.contact_email && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.contact_email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                    <textarea
                      name="target_audience"
                      id="target_audience"
                      rows={3}
                      placeholder="Describe your target audience"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                    />
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#3366FF] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Generate Newsletter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoadingModal isOpen={isLoading} message="Setting up your newsletter..." onClose={() => {}} />
      <ErrorModal isOpen={!!error} error={error || ''} onClose={handleCloseModal} />
      <SuccessModal isOpen={!!success} message={success || ''} onClose={handleCloseModal} />
    </div>
  );
}
