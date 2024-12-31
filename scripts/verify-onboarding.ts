import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import chalk from 'chalk';
import { Database } from '../types/database';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ANSI color codes for better visibility
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m'
};

type QueueItem = Database['public']['Tables']['newsletter_generation_queue']['Row'];
type Newsletter = Database['public']['Tables']['newsletters']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type NewsletterSection = Database['public']['Tables']['newsletter_sections']['Row'];

async function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getCompanyAndNewsletter(newsletterId: string): Promise<{ company: Company; newsletter: Newsletter } | null> {
  const { data: newsletter, error: newsletterError } = await supabase
    .from('newsletters')
    .select('*, companies(*)')
    .eq('id', newsletterId)
    .single();

  if (newsletterError || !newsletter) {
    await colorLog('error', `Error fetching newsletter: ${newsletterError?.message || 'Not found'}`);
    return null;
  }

  return {
    newsletter: newsletter,
    company: newsletter.companies as Company
  };
}

async function getNewsletterSections(newsletterId: string): Promise<NewsletterSection[]> {
  const { data: sections, error } = await supabase
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .order('section_number', { ascending: true });

  if (error) {
    await colorLog('error', `Error fetching sections: ${error.message}`);
    return [];
  }

  return sections || [];
}

async function getQueueItems(newsletterId: string): Promise<QueueItem[]> {
  const { data: queueItems, error } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .order('section_number', { ascending: true });

  if (error) {
    await colorLog('error', `Error fetching queue items: ${error.message}`);
    return [];
  }

  return queueItems || [];
}

async function monitorProgress() {
  try {
    while (true) {  // Keep monitoring until complete
      // Get the most recent newsletter
      const { data: newsletters, error: newsletterError } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (newsletterError || !newsletters || newsletters.length === 0) {
        await colorLog('error', 'No newsletters found or error fetching newsletters');
        return;
      }

      const newsletter = newsletters[0];
      const data = await getCompanyAndNewsletter(newsletter.id);
      
      if (!data) {
        await colorLog('error', 'Failed to fetch newsletter details');
        return;
      }

      const { company } = data;
      const sections = await getNewsletterSections(newsletter.id);
      const queueItems = await getQueueItems(newsletter.id);

      console.clear();
      await colorLog('info', '\n=== Newsletter Generation Status ===');
      await colorLog('info', `Company: ${company.company_name}`);
      await colorLog('info', `Contact Email: ${company.contact_email}`);
      await colorLog('info', `Newsletter ID: ${newsletter.id}`);
      await colorLog('info', `Status: ${newsletter.status}\n`);

      // Display sections status
      await colorLog('info', '=== Sections Status ===');
      for (const section of sections) {
        const queueItem = queueItems.find(q => q.section_number === section.section_number);
        const status = queueItem?.status || 'unknown';
        const hasContent = !!section.content;
        const hasImage = !!section.image_url;

        const sectionInfo = `Section ${section.section_number}: ${section.title || 'Untitled'}`;
        const contentStatus = hasContent ? '✓ Content' : '✗ Content';
        const imageStatus = hasImage ? '✓ Image' : '✗ Image';
        
        switch (status) {
          case 'completed':
            await colorLog('success', `✓ ${sectionInfo}`);
            await colorLog('success', `  ${contentStatus} | ${imageStatus}`);
            break;
          case 'failed':
            await colorLog('error', `✗ ${sectionInfo}`);
            await colorLog('error', `  ${contentStatus} | ${imageStatus}`);
            if (queueItem?.error_message) {
              await colorLog('error', `  Error: ${queueItem.error_message}`);
            }
            break;
          case 'in_progress':
            await colorLog('info', `⟳ ${sectionInfo}`);
            await colorLog('info', `  ${contentStatus} | ${imageStatus}`);
            break;
          default:
            await colorLog('warning', `○ ${sectionInfo}`);
            await colorLog('warning', `  ${contentStatus} | ${imageStatus}`);
        }
      }

      // Check if everything is complete
      const allSectionsComplete = sections.length === 3 && 
        sections.every(s => s.content && s.image_url);
      const allQueueItemsComplete = queueItems.every(q => q.status === 'completed');

      if (allSectionsComplete && allQueueItemsComplete) {
        await colorLog('success', '\n✓ Newsletter generation completed successfully!');
        await colorLog('info', `\nReady to send draft to: ${company.contact_email}`);
        break;  // Exit the monitoring loop
      } else {
        await colorLog('warning', '\n⟳ Newsletter generation still in progress...');
        
        // Show what's missing
        const missingSections = 3 - sections.length;
        if (missingSections > 0) {
          await colorLog('warning', `  Missing ${missingSections} section(s)`);
        }
        
        const incompleteContent = sections.filter(s => !s.content).length;
        if (incompleteContent > 0) {
          await colorLog('warning', `  ${incompleteContent} section(s) missing content`);
        }
        
        const incompleteImages = sections.filter(s => !s.image_url).length;
        if (incompleteImages > 0) {
          await colorLog('warning', `  ${incompleteImages} section(s) missing images`);
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000));  // Check every 5 seconds
    }
  } catch (error) {
    await colorLog('error', `Monitoring error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Start monitoring
monitorProgress();
