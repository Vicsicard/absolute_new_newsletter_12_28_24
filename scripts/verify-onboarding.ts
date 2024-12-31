import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { initializeGenerationQueue } from '../utils/newsletter';
import type { Database } from '../types/supabase';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Utility functions for colored output
const format = {
  success: (text: string) => `${colors.green}${text}${colors.reset}`,
  warning: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  error: (text: string) => `${colors.red}${text}${colors.reset}`,
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  bold: (text: string) => `${colors.bold}${text}${colors.reset}`
};

// Status icons with colors
const icons = {
  success: format.success('✅'),
  pending: format.warning('⏳'),
  error: format.error('❌'),
  warning: format.warning('⚠️')
};

interface ErrorLog {
  id: string;
  timestamp: string;
  error_type: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
}

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  section_number: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  last_error?: string;
  error_count?: number;
  last_attempt_at?: string;
}

interface OnboardingVerification {
  company: {
    exists: boolean;
    id?: string;
    created_at?: string;
  };
  newsletter: {
    exists: boolean;
    id?: string;
    created_at?: string;
    draft_status?: string;
    draft_sent_at?: string;
  };
  sections: {
    exists: boolean;
    count: number;
    created_at?: string;
    allGenerated: boolean;
  };
  queue: {
    items: number;
    completed: number;
    failed: number;
    inProgress: number;
    errors: {
      count: number;
      lastError?: string;
      lastErrorTime?: string;
    };
  };
  errors: {
    recent: ErrorLog[];
    count: number;
  };
}

interface Section {
  id: string;
  newsletter_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

interface Company {
  id: string;
  contact_email: string;
  created_at: string;
}

interface Newsletter {
  id: string;
  company_id: string;
  created_at: string;
  draft_status: string;
  draft_sent_at: string;
}

interface NewsletterSection {
  id: string;
  newsletter_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

async function getRecentErrors(newsletterId: string): Promise<ErrorLog[]> {
  const { data: errorLogs, error } = await supabase
    .from('error_logs')
    .select('*')
    .filter('context->newsletter_id', 'eq', newsletterId)
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }

  return errorLogs || [];
}

async function verifyOnboarding(companyEmail: string): Promise<OnboardingVerification> {
  // Check company
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('contact_email', companyEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (companyError) {
    throw new Error(`Error checking company: ${companyError.message}`);
  }

  const company = companies?.[0];
  if (!company) {
    return {
      company: { exists: false },
      newsletter: { exists: false },
      sections: { exists: false, count: 0, allGenerated: false },
      queue: { items: 0, completed: 0, failed: 0, inProgress: 0, errors: { count: 0 } },
      errors: { recent: [], count: 0 }
    };
  }

  // Check newsletter
  const { data: newsletters, error: newsletterError } = await supabase
    .from('newsletters')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (newsletterError) {
    throw new Error(`Error checking newsletter: ${newsletterError.message}`);
  }

  const newsletter = newsletters?.[0];
  if (!newsletter) {
    return {
      company: { exists: true, id: company.id, created_at: company.created_at },
      newsletter: { exists: false },
      sections: { exists: false, count: 0, allGenerated: false },
      queue: { items: 0, completed: 0, failed: 0, inProgress: 0, errors: { count: 0 } },
      errors: { recent: [], count: 0 }
    };
  }

  // Check sections
  const { data: sections, error: sectionsError } = await supabase
    .from('newsletter_sections')
    .select('*')
    .eq('newsletter_id', newsletter.id)
    .order('created_at', { ascending: false });

  if (sectionsError) {
    throw new Error(`Error checking sections: ${sectionsError.message}`);
  }

  // Check queue status and errors
  const { data: queueItems, error: queueError } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('newsletter_id', newsletter.id);

  if (queueError) {
    throw new Error(`Error checking queue: ${queueError.message}`);
  }

  // Get recent errors
  const recentErrors = await getRecentErrors(newsletter.id);

  // Initialize queue if it's empty
  if (!queueItems || queueItems.length === 0) {
    console.log('Queue is empty, initializing...');
    try {
      await initializeGenerationQueue(newsletter.id, supabase);
      console.log('Queue initialized successfully');
      
      // Fetch updated queue status
      const { data: updatedQueue, error: updateError } = await supabase
        .from('newsletter_generation_queue')
        .select('*')
        .eq('newsletter_id', newsletter.id);
        
      if (updateError) {
        throw new Error(`Error checking updated queue: ${updateError.message}`);
      }
      
      queueItems = updatedQueue;
    } catch (error) {
      console.error('Failed to initialize queue:', error);
      throw new Error(`Queue initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate queue statistics
  const completedItems = (queueItems as QueueItem[] || []).filter(item => item.status === 'completed').length;
  const failedItems = (queueItems as QueueItem[] || []).filter(item => item.status === 'failed').length;
  const inProgressItems = (queueItems as QueueItem[] || []).filter(item => item.status === 'in_progress').length;
  
  // Calculate error statistics
  const itemsWithErrors = queueItems?.filter(item => item.error_count && item.error_count > 0) || [];
  const totalErrors = itemsWithErrors.reduce((sum, item) => sum + (item.error_count || 0), 0);
  const lastErrorItem = itemsWithErrors.sort((a, b) => 
    new Date(b.last_attempt_at || 0).getTime() - new Date(a.last_attempt_at || 0).getTime()
  )[0];

  return {
    company: {
      exists: true,
      id: company.id,
      created_at: company.created_at
    },
    newsletter: {
      exists: true,
      id: newsletter.id,
      created_at: newsletter.created_at,
      draft_status: newsletter.draft_status,
      draft_sent_at: newsletter.draft_sent_at
    },
    sections: {
      exists: sections.length > 0,
      count: sections.length,
      created_at: sections[0]?.created_at,
      allGenerated: (sections as NewsletterSection[]).every(s => s.content && s.image_url)
    },
    queue: {
      items: queueItems?.length || 0,
      completed: completedItems,
      failed: failedItems,
      inProgress: inProgressItems,
      errors: {
        count: totalErrors,
        lastError: lastErrorItem?.last_error,
        lastErrorTime: lastErrorItem?.last_attempt_at
      }
    },
    errors: {
      recent: recentErrors,
      count: recentErrors.length
    }
  };
}

function formatDuration(startTime: string): string {
  const duration = new Date().getTime() - new Date(startTime).getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

async function monitorProcess(email: string) {
  console.log('\nStarting monitoring process for email:', format.info(email));
  console.log('This may take several minutes...\n');

  let attempt = 0;
  const maxAttempts = 60; // 30 minutes (30 seconds * 60)
  const startTime = new Date().toISOString();

  while (attempt < maxAttempts) {
    attempt++;
    console.clear(); // Clear console for cleaner output
    console.log(format.bold(`\nMonitoring Onboarding Process (Attempt ${attempt}/${maxAttempts})`));
    console.log(format.info(`Running time: ${formatDuration(startTime)}`));
    console.log('----------------------------------------\n');

    const status = await verifyOnboarding(email);

    // Company Status
    console.log(format.bold('1. Company Creation:'));
    console.log(`   Status: ${status.company.exists ? icons.success : icons.pending} ${status.company.exists ? 'Created' : 'Pending'}`);
    if (status.company.created_at) {
      console.log(`   Created At: ${format.info(new Date(status.company.created_at).toLocaleString())}`);
    }
    console.log();

    // Newsletter Status
    console.log(format.bold('2. Newsletter Creation:'));
    console.log(`   Status: ${status.newsletter.exists ? icons.success : icons.pending} ${status.newsletter.exists ? 'Created' : 'Pending'}`);
    if (status.newsletter.created_at) {
      console.log(`   Created At: ${format.info(new Date(status.newsletter.created_at).toLocaleString())}`);
    }
    console.log();

    // Sections Status
    console.log(format.bold('3. Newsletter Sections:'));
    console.log(`   Status: ${status.sections.exists ? icons.success : icons.pending} ${status.sections.exists ? 'Created' : 'Pending'}`);
    console.log(`   Count: ${format.info(`${status.sections.count}/3`)}`);
    console.log(`   Content Generated: ${status.sections.allGenerated ? icons.success : icons.pending} ${status.sections.allGenerated ? 'Complete' : 'In Progress'}`);
    console.log();

    // Queue Status
    console.log(format.bold('4. Generation Queue:'));
    console.log(`   Total Items: ${format.info(status.queue.items.toString())}`);
    console.log(`   Completed: ${format.success(status.queue.completed.toString())}`);
    console.log(`   In Progress: ${format.warning(status.queue.inProgress.toString())}`);
    console.log(`   Failed: ${status.queue.failed > 0 ? format.error(status.queue.failed.toString()) : '0'}`);
    
    if (status.queue.errors.count > 0) {
      console.log(format.error('\n   Error Information:'));
      console.log(`   - Total Errors: ${format.error(status.queue.errors.count.toString())}`);
      if (status.queue.errors.lastError) {
        console.log(`   - Last Error: ${format.error(status.queue.errors.lastError)}`);
        console.log(`   - Last Error Time: ${format.info(new Date(status.queue.errors.lastErrorTime!).toLocaleString())}`);
      }
    }
    console.log();

    // Recent Errors
    if (status.errors.recent.length > 0) {
      console.log(format.bold('5. Recent Errors:'));
      status.errors.recent.forEach((error, index) => {
        console.log(format.error(`   ${index + 1}. ${error.error_type}: ${error.message}`));
        console.log(`      Time: ${format.info(new Date(error.timestamp).toLocaleString())}`);
        if (error.context) {
          console.log(`      Context: ${format.info(JSON.stringify(error.context, null, 2))}`);
        }
      });
      console.log();
    }

    // Draft Email Status
    console.log(format.bold('6. Draft Email:'));
    console.log(`   Status: ${format.info(status.newsletter.draft_status || 'pending')}`);
    console.log(`   Sent At: ${status.newsletter.draft_sent_at ? 
      format.info(new Date(status.newsletter.draft_sent_at).toLocaleString()) : format.warning('Not sent yet')}`);

    // Check if process is complete
    if (
      status.sections.allGenerated &&
      status.queue.completed === status.queue.items &&
      status.newsletter.draft_sent_at
    ) {
      console.log(format.success('\n✅ Onboarding process completed successfully!'));
      break;
    }

    // Check for fatal errors
    if (status.queue.failed === status.queue.items) {
      console.log(format.error('\n❌ Process failed - all queue items have failed'));
      console.log(format.error('Please check the error logs above for details'));
      break;
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
  }

  if (attempt >= maxAttempts) {
    console.log(format.warning('\n⚠️ Monitoring timed out after 30 minutes'));
    console.log('The process may still be running. Please check the status later.');
  }
}

async function main() {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error('Please provide an email address as an argument');
      process.exit(1);
    }

    await monitorProcess(email);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
