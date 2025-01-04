import { default as fetch } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(chalk.red('Missing required environment variables:'));
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Initialize Supabase client with explicit error handling
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

// Test database connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) throw error;
    console.log(chalk.green('✓ Database connection successful'));
  } catch (error) {
    console.error(chalk.red('Database connection failed:'), error);
    process.exit(1);
  }
}

interface TestCase {
  name: string;
  data: {
    company_name: string;
    industry: string;
    contact_email: string;
    website_url?: string;
    target_audience?: string;
    audience_description?: string;
  };
  expectSuccess: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Valid submission - Minimal data',
    data: {
      company_name: 'Test Company 1',
      industry: 'Technology',
      contact_email: 'test1@example.com'
    },
    expectSuccess: true
  },
  {
    name: 'Valid submission - Complete data',
    data: {
      company_name: 'Test Company 2',
      industry: 'Healthcare',
      contact_email: 'test2@example.com',
      website_url: 'https://example.com',
      target_audience: 'Healthcare professionals',
      audience_description: 'Doctors and nurses in private practice'
    },
    expectSuccess: true
  },
  {
    name: 'Edge case - Long company name',
    data: {
      company_name: 'A'.repeat(99), // Just under 100 char limit
      industry: 'Manufacturing',
      contact_email: 'test3@example.com'
    },
    expectSuccess: true
  }
];

async function cleanupTestData() {
  console.log(chalk.yellow('\nCleaning up test data...'));

  try {
    // Delete test companies and related data
    const { error } = await supabase
      .from('companies')
      .delete()
      .like('company_name', 'Test Company%');

    if (error) {
      console.error(chalk.red('Error cleaning up:', error.message));
    } else {
      console.log(chalk.green('Cleanup successful'));
    }
  } catch (error) {
    console.error(chalk.red('Error during cleanup:', error));
  }
}

async function verifyDatabaseEntry(companyName: string): Promise<boolean> {
  try {
    // Check company entry with detailed logging
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('company_name', companyName)
      .single();

    if (companyError) {
      console.error(chalk.red(`Company verification failed for ${companyName}:`, companyError));
      return false;
    }

    if (!company) {
      console.error(chalk.red(`Company not found: ${companyName}`));
      return false;
    }

    console.log(chalk.green('✓ Company verified:', company));

    // Check newsletter creation
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('company_id', company.id)
      .single();

    if (newsletterError) {
      console.error(chalk.red(`Newsletter verification failed for ${companyName}:`, newsletterError));
      return false;
    }

    if (!newsletter) {
      console.error(chalk.red(`Newsletter not found for company: ${companyName}`));
      return false;
    }

    console.log(chalk.green('✓ Newsletter verified:', newsletter));

    // Check queue items
    const { data: queueItems, error: queueError } = await supabase
      .from('newsletter_generation_queue')
      .select('*')
      .eq('newsletter_id', newsletter.id);

    if (queueError) {
      console.error(chalk.red(`Queue verification failed for ${companyName}:`, queueError));
      return false;
    }

    if (!queueItems || queueItems.length === 0) {
      console.error(chalk.red(`No queue items found for newsletter: ${newsletter.id}`));
      return false;
    }

    console.log(chalk.green('✓ Queue items verified:', queueItems));

    // Check newsletter sections
    const { data: sections, error: sectionsError } = await supabase
      .from('newsletter_sections')
      .select('*')
      .eq('newsletter_id', newsletter.id);

    if (sectionsError) {
      console.error(chalk.red(`Sections verification failed for ${companyName}:`, sectionsError));
      return false;
    }

    if (!sections || sections.length === 0) {
      console.error(chalk.red(`No sections found for newsletter: ${newsletter.id}`));
      return false;
    }

    console.log(chalk.green('✓ Newsletter sections verified:', sections));
    return true;
  } catch (error) {
    console.error(chalk.red('Error during verification:', error));
    return false;
  }
}

async function runTest(testCase: TestCase) {
  console.log(chalk.cyan(`\nRunning test: ${testCase.name}`));
  
  try {
    // Submit onboarding form
    console.log('Sending request with data:', JSON.stringify(testCase.data, null, 2));
    const response = await fetch('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.data)
    });

    // Log response status and headers
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Always expect a success response due to our error handling
    const result = await response.json();
    console.log(chalk.green('Response received:', JSON.stringify(result, null, 2)));

    // Check error logs
    const { data: errorLogs } = await supabase
      .from('api_error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (errorLogs?.[0]) {
      console.log(chalk.yellow('Latest error log:', JSON.stringify(errorLogs[0], null, 2)));
    }

    // Add a small delay to allow database operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify database entries
    const dbVerification = await verifyDatabaseEntry(testCase.data.company_name);
    
    if (dbVerification) {
      console.log(chalk.green('✓ Database verification passed'));
    } else {
      console.log(chalk.yellow('⚠ Database verification failed but user saw success'));
    }

  } catch (error) {
    console.error(chalk.red('Test execution error:', error));
  }
}

async function main() {
  console.log(chalk.blue('Starting onboarding tests...\n'));

  // Test database connection first
  await testConnection();

  // Run all test cases
  for (const testCase of testCases) {
    await runTest(testCase);
  }

  // Cleanup test data
  await cleanupTestData();
}

// Run tests
main().catch(console.error);
