'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateForm } from '@/utils/validation';
import LoadingModal from '@/components/LoadingModal';
import SuccessModal from '@/components/SuccessModal';
import { FormErrors } from '@/types/form';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Check for previous submission on component mount
  useEffect(() => {
    const hasAlreadySubmitted = localStorage.getItem('newsletterSubmitted');
    if (hasAlreadySubmitted) {
      setHasSubmitted(true);
    }

    // Prevent back navigation
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    // Prevent refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAlreadySubmitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');

    if (hasSubmitted) {
      console.log('Already submitted, preventing resubmission');
      return;
    }

    // Validate form before proceeding
    const formData = new FormData(e.target as HTMLFormElement);
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors found:', errors);
      setFormErrors(errors);
      return;
    }

    // Reset states and show success immediately after validation
    console.log('Form validated, proceeding with submission');
    setIsLoading(true);
    setFormErrors({});
    
    // Get the contact email for the success message
    const formDataObj = Object.fromEntries(formData);
    const contactEmail = formDataObj.contact_email as string;
    
    // Show success message immediately after validation
    setSuccess(`Thank you for your submission! Your draft newsletter will be emailed to ${contactEmail} within 36 hours. Please check your spam folder if you don't see it in your inbox.`);
    localStorage.setItem('newsletterSubmitted', 'true');
    setHasSubmitted(true);
    
    // Continue with the API calls in the background
    try {
      console.log('Calling Supabase function...');
      const response = await fetch('https://odjvatrrqyuspcjxlnki.supabase.co/rest/v1/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          company_name: formDataObj.company_name,
          website_url: formDataObj.website_url,
          industry: formDataObj.industry,
          contact_email: formDataObj.contact_email,
          target_audience: formDataObj.target_audience
        })
      });

      if (response.ok) {
        const company = await response.json();
        console.log('Company created:', company);

        // Create newsletter
        const newsletterResponse = await fetch('https://odjvatrrqyuspcjxlnki.supabase.co/rest/v1/newsletters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            company_id: company[0].id,
            subject: `Newsletter for ${formDataObj.company_name}`,
            status: 'draft',
            draft_status: 'draft',
            draft_recipient_email: formDataObj.contact_email
          })
        });

        if (newsletterResponse.ok) {
          const newsletter = await newsletterResponse.json();
          console.log('Newsletter created:', newsletter);
        } else {
          console.error('Failed to create newsletter:', await newsletterResponse.text());
        }
      } else {
        console.error('Failed to create company:', await response.text());
      }
    } catch (apiError) {
      // Log the error but don't show it to the user
      console.error('API error:', apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSuccess(null);
  };

  // Show submitted state if already submitted
  if (hasSubmitted && !isLoading && !success) {
    return (
      <div className="min-h-screen bg-[#3366FF] py-6 flex flex-col justify-center">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow-2xl rounded-2xl sm:p-10">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Thank You!</h2>
              <p className="text-lg text-gray-600 mb-6">
                Your newsletter is being generated. Please check your email for the draft within 36 hours.
              </p>
              <p className="text-sm text-gray-500">
                Note: Only one newsletter submission is allowed per month.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow-2xl rounded-2xl sm:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Newsletter Setup</h2>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <SuccessModal isOpen={!!success} message={success || ''} onClose={handleCloseModal} />
    </div>
  );
}
