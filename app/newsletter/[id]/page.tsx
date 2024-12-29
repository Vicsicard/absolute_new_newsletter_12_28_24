'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parseNewsletterSection } from '@/utils/newsletter-client';
import type { NewsletterSectionInput } from '@/utils/newsletter-client';

interface NewsletterPageProps {
  params: {
    id: string;
  };
}

export default function NewsletterPage({ params }: NewsletterPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState<any>(null);
  const [sendStatus, setSendStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating newsletter for ID:', params.id);
      const response = await fetch(`/api/newsletter/generate/${params.id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate newsletter');
      }
      
      const data = await response.json();
      console.log('Generated newsletter:', data);
      setNewsletter(data);
    } catch (err) {
      console.error('Error generating newsletter:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    setSendStatus(null);
    
    try {
      const response = await fetch(`/api/newsletter/send/${params.id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send newsletter');
      }
      
      const data = await response.json();
      setSendStatus({
        success: true,
        message: 'Newsletter sent successfully!',
      });
    } catch (err) {
      setSendStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send newsletter',
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderSection = (section: NewsletterSectionInput, index: number) => (
    <div key={index} className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      <div className="prose max-w-none">
        {section.content.split('\n').map((paragraph, i) => (
          <p key={i} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
      {section.image_url && (
        <div className="mt-4">
          <Image
            src={section.image_url}
            alt={section.title}
            width={800}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Newsletter Preview</h1>
        <div className="space-x-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
          {newsletter && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {sendStatus && (
        <div
          className={`${
            sendStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          } border px-4 py-3 rounded mb-4`}
        >
          {sendStatus.message}
        </div>
      )}

      {newsletter && newsletter.sections && (
        <div className="space-y-8">
          {newsletter.sections.map((section: NewsletterSectionInput, index: number) =>
            renderSection(section, index)
          )}
        </div>
      )}

      {!newsletter && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          Click Generate to create your newsletter
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating your newsletter...</p>
        </div>
      )}
    </div>
  );
}
