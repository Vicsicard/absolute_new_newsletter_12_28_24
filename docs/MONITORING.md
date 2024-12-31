# Monitoring Tools and Scripts

This document contains monitoring tools and scripts for the newsletter application.

## Onboarding Process Monitor

The onboarding process monitor script tracks the complete flow of newsletter generation from company creation to email sending. The script monitors the process for a specific submission by tracking the contact email provided in the submission form.

### Usage

```bash
npx ts-node scripts/verify-onboarding.ts {contact_email}
```

Replace `{contact_email}` with the email address that was submitted through the onboarding form.

### What it Monitors

1. Company Creation
   - Existence of company record
   - Creation timestamp

2. Newsletter Creation
   - Association with company
   - Creation timestamp
   - Draft status

3. Newsletter Sections
   - Creation of all 3 sections
   - Content generation status
   - Image generation status

4. Generation Queue
   - Number of queue items
   - Completed items
   - Failed items

5. Email Status
   - Draft email status
   - Sending timestamp

### Script Location

The script is located at `scripts/verify-onboarding.ts`. Here's the complete implementation:

```typescript
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
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
  };
}

interface QueueItem {
  id: string;
  newsletter_id: string;
  section_type: string;
  status: string;
  attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      queue: { items: 0, completed: 0, failed: 0 }
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
      queue: { items: 0, completed: 0, failed: 0 }
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

  // Check queue status
  const { data: queueItems, error: queueError } = await supabase
    .from('newsletter_generation_queue')
    .select('*')
    .eq('newsletter_id', newsletter.id);

  if (queueError) {
    throw new Error(`Error checking queue: ${queueError.message}`);
  }

  const completedItems = (queueItems as QueueItem[] || []).filter(item => item.status === 'completed').length;
  const failedItems = (queueItems as QueueItem[] || []).filter(item => item.status === 'failed').length;

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
      failed: failedItems
    }
  };
}

async function monitorProcess(email: string) {
  console.log(`\nStarting monitoring process for email: ${email}`);
  console.log('This may take several minutes...\n');

  let complete = false;
  let attempts = 0;
  const maxAttempts = 60; // 30 minutes maximum (30 * 60 seconds)
  
  while (!complete && attempts < maxAttempts) {
    attempts++;
    const result = await verifyOnboarding(email);
    
    console.clear(); // Clear console for cleaner output
    console.log(`\nMonitoring Onboarding Process (Attempt ${attempts}/${maxAttempts})`);
    console.log('----------------------------------------');
    
    // Company Status
    console.log('\n1. Company Creation:');
    console.log(`   Status: ${result.company.exists ? '✅ Created' : '⏳ Pending'}`);
    if (result.company.exists) {
      console.log(`   Created At: ${new Date(result.company.created_at!).toLocaleString()}`);
    }

    // Newsletter Status
    console.log('\n2. Newsletter Creation:');
    console.log(`   Status: ${result.newsletter.exists ? '✅ Created' : '⏳ Pending'}`);
    if (result.newsletter.exists) {
      console.log(`   Created At: ${new Date(result.newsletter.created_at!).toLocaleString()}`);
    }

    // Sections Status
    console.log('\n3. Newsletter Sections:');
    console.log(`   Status: ${result.sections.exists ? '✅ Created' : '⏳ Pending'}`);
    console.log(`   Count: ${result.sections.count}/3`);
    console.log(`   Content Generated: ${result.sections.allGenerated ? '✅ Complete' : '⏳ In Progress'}`);

    // Queue Status
    console.log('\n4. Generation Queue:');
    console.log(`   Total Items: ${result.queue.items}`);
    console.log(`   Completed: ${result.queue.completed}`);
    console.log(`   Failed: ${result.queue.failed}`);
    
    // Email Status
    console.log('\n5. Draft Email:');
    if (result.newsletter.exists) {
      console.log(`   Status: ${result.newsletter.draft_status}`);
      console.log(`   Sent At: ${result.newsletter.draft_sent_at ? 
        new Date(result.newsletter.draft_sent_at).toLocaleString() : 'Not sent yet'}`);
    } else {
      console.log('   Status: Waiting for newsletter creation');
    }

    // Check if process is complete
    complete = result.company.exists && 
              result.newsletter.exists && 
              result.sections.exists &&
              result.sections.count === 3 &&
              result.sections.allGenerated &&
              result.queue.completed === result.queue.items &&
              result.newsletter.draft_status === 'sent';

    if (complete) {
      console.log('\n✅ Process Complete!');
      console.log('All steps verified successfully.');
      break;
    } else if (result.queue.failed > 0) {
      console.log('\n❌ Process Failed!');
      console.log(`${result.queue.failed} queue items failed.`);
      break;
    }

    // Wait before next check
    await sleep(30000); // Check every 30 seconds
  }

  if (!complete && attempts >= maxAttempts) {
    console.log('\n⚠️ Monitoring timed out after 30 minutes');
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
```

### Example Output

```
Monitoring Onboarding Process (Attempt 1/60)
----------------------------------------

1. Company Creation:
   Status: ✅ Created
   Created At: [timestamp]

2. Newsletter Creation:
   Status: ✅ Created
   Created At: [timestamp]

3. Newsletter Sections:
   Status: ✅ Created
   Count: 3/3
   Content Generated: ⏳ In Progress

4. Generation Queue:
   Total Items: 3
   Completed: 1
   Failed: 0

5. Draft Email:
   Status: pending
   Sent At: Not sent yet
```

### Success Criteria

The monitoring process is considered complete when:
1. Company exists with the provided contact email
2. Newsletter exists for that company
3. All 3 sections exist
4. All sections have content and images generated
5. All queue items are completed
6. Draft email has been sent to the contact email

The process will timeout after 30 minutes if not completed.

### Monitoring a Specific Submission

To monitor a specific submission:

1. Get the contact email from the submission form
2. Run the script with that email:
   ```bash
   npx ts-node scripts/verify-onboarding.ts "{contact_email}"
   ```
3. The script will track all stages of the process for that specific submission

Note: Each submission is uniquely identified by the contact email, so make sure to use the exact email that was provided in the submission form.
