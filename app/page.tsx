'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validateForm } from '@/utils/validation';
import LoadingModal from '@/components/LoadingModal';
import SuccessModal from '@/components/SuccessModal';
import ErrorModal from '@/components/ErrorModal';
import { FormErrors } from '@/types/form';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowModal(true);
    setError(null);
    setFormErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    setEmail(formData.get('contact_email') as string);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      setShowModal(false);
      return;
    }

    try {
      console.log('Submitting form data...');
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(5 * 60 * 1000)
      });

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error('Request timed out. Please try again.');
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (e) {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setIsSuccess(true);
        setSuccess(data.message || 'Successfully processed your request');
        if (data.data?.company_id) {
          // Get the latest newsletter for this company
          const newsletterResponse = await fetch(`/api/company/${data.data.company_id}/latest-newsletter`);
          const newsletterData = await newsletterResponse.json();
          
          if (newsletterData.success && newsletterData.data?.id) {
            // Redirect to the newsletter page
            router.push(`/newsletter/${newsletterData.data.id}`);
          } else {
            throw new Error('Failed to get newsletter ID');
          }
        }
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process request');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.company_name ? 'border-red-500' : ''
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.website_url ? 'border-red-500' : ''
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.contact_email ? 'border-red-500' : ''
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.phone_number ? 'border-red-500' : ''
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.industry ? 'border-red-500' : ''
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.target_audience ? 'border-red-500' : ''
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
                      rows={3}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.audience_description ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.audience_description && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.audience_description}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newsletter_objectives" className="block text-sm font-medium text-gray-700">Newsletter Objectives</label>
                    <textarea
                      name="newsletter_objectives"
                      id="newsletter_objectives"
                      rows={3}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.newsletter_objectives ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.newsletter_objectives && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.newsletter_objectives}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="primary_cta" className="block text-sm font-medium text-gray-700">Primary Call to Action</label>
                    <input
                      type="text"
                      name="primary_cta"
                      id="primary_cta"
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.primary_cta ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.primary_cta && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.primary_cta}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact_list" className="block text-sm font-medium text-gray-700">Contact List (CSV)</label>
                    <input
                      type="file"
                      name="contact_list"
                      id="contact_list"
                      accept=".csv"
                      className={`mt-1 block w-full ${
                        formErrors.contact_list ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.contact_list && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.contact_list}</p>
                    )}
                  </div>

                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <LoadingModal 
                isOpen={isLoading} 
                email={email} 
                isSuccess={isSuccess} 
                onClose={handleCloseModal}
                error={error}
              />
              {error && <ErrorModal message={error} onClose={handleCloseModal} />}
              {success && <SuccessModal message={success} email={email} onClose={handleCloseModal} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
