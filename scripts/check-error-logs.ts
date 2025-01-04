import { getSupabaseAdmin } from '../utils/supabase-admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkErrorLogs() {
  console.log(chalk.blue('Checking error logs...\n'));

  const supabaseAdmin = getSupabaseAdmin();

  // Get the latest error logs
  const { data: errorLogs, error } = await supabaseAdmin
    .from('api_error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(chalk.red('Error fetching error logs:'), error);
    process.exit(1);
  }

  if (!errorLogs || errorLogs.length === 0) {
    console.log(chalk.green('No error logs found.'));
    return;
  }

  console.log(chalk.yellow(`Found ${errorLogs.length} error logs:`));
  errorLogs.forEach((log, index) => {
    console.log(chalk.cyan(`\n[Error Log ${index + 1}]`));
    console.log('Endpoint:', log.endpoint);
    console.log('Method:', log.method);
    console.log('Error Message:', log.error_message);
    console.log('Error Code:', log.error_code);
    console.log('Created At:', new Date(log.created_at).toLocaleString());
    if (log.stack_trace) {
      console.log('Stack Trace:', log.stack_trace);
    }
    if (log.metadata) {
      console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
    }
  });
}

checkErrorLogs().catch(console.error);
