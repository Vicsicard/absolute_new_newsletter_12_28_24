import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { sendEmail, EmailResponse } from '@/utils/email';
import { generateEmailHTML, generatePlainText } from '@/utils/email-template';
import { parseNewsletterSection } from '@/utils/newsletter';
import type { Newsletter, NewsletterContact, Contact } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { newsletterId } = await req.json();

    // Get newsletter and company data
    const { data: newsletter, error: newsletterError } = await supabaseAdmin
      .from('newsletters')
      .select(`
        *,
        companies (
          company_name,
          industry,
          contact_email
        ),
        newsletter_contacts (
          id,
          contacts (
            id,
            email,
            status
          )
        )
      `)
      .eq('id', newsletterId)
      .single<Newsletter>();

    if (newsletterError) {
      console.error('Newsletter fetch error:', newsletterError);
      throw new Error(`Failed to fetch newsletter: ${newsletterError.message}`);
    }

    if (!newsletter) {
      console.error('Newsletter not found for ID:', newsletterId);
      throw new Error('Newsletter not found');
    }

    if (!newsletter.newsletter_contacts || newsletter.newsletter_contacts.length === 0) {
      console.error('No contacts found for newsletter:', newsletterId);
      throw new Error('No contacts found for this newsletter');
    }

    // Parse newsletter sections
    const section1 = parseNewsletterSection(newsletter.section1_content);
    const section2 = parseNewsletterSection(newsletter.section2_content);
    const section3 = parseNewsletterSection(newsletter.section3_content);

    const sections = [section1, section2, section3].filter(Boolean);
    console.log('Parsed sections:', sections.length);

    // Generate HTML and plain text versions
    const htmlContent = generateEmailHTML(
      newsletter.companies.company_name,
      sections
    );

    const textContent = generatePlainText(
      newsletter.companies.company_name,
      sections
    );

    console.log('Content generated. HTML length:', htmlContent.length);

    // Filter out contacts and ensure they are active
    const contacts = newsletter.newsletter_contacts
      .map((nc: NewsletterContact) => nc.contacts)
      .filter((contact): contact is Contact => {
        if (!contact) return false;
        if (!contact.email) return false;
        if (contact.status === 'unsubscribed') return false;
        return true;
      });

    console.log('Found contacts:', contacts.length);
    
    if (contacts.length === 0) {
      throw new Error('No active contacts found for this newsletter');
    }

    const emailPromises = contacts.map(async (contact) => {
      try {
        console.log('Attempting to send to:', contact.email);
        const result = await sendEmail(
          contact.email,
          `${newsletter.companies.company_name} - Industry Newsletter`,
          htmlContent
        );
        console.log('Send result for', contact.email, ':', result);
        return result;
      } catch (error) {
        console.error('Failed to send to', contact.email, ':', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          email: contact.email 
        };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    console.log('All send results:', JSON.stringify(results, null, 2));

    // Check if any emails failed to send
    const failedEmails = results.filter((result) => {
      if (!result.success) {
        console.log('Failed email:', {
          email: result.email,
          error: result.error
        });
        return true;
      }
      return false;
    });
    
    console.log('Failed emails:', failedEmails.length, JSON.stringify(failedEmails, null, 2));

    // Update newsletter status
    const updateData = {
      sent_at: new Date().toISOString(),
      sent_count: results.length - failedEmails.length,
      failed_count: failedEmails.length,
      last_sent_status: failedEmails.length === 0 ? 'success' : 'partial_failure',
      status: 'sent'
    };

    console.log('Updating newsletter with:', updateData);

    const { error: updateError } = await supabaseAdmin
      .from('newsletters')
      .update(updateData)
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Failed to update newsletter status:', updateError);
    }

    return Response.json({
      success: true,
      totalSent: results.length - failedEmails.length,
      failedCount: failedEmails.length,
      status: failedEmails.length === 0 ? 'success' : 'partial_failure'
    });

  } catch (error) {
    console.error('Newsletter sending error:', error);
    return Response.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send newsletter',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
