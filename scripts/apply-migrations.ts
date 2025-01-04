import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

async function applyMigrations() {
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

  // Read and execute the migration files
  const migrationFiles = [
    '20250103_complete_schema.sql',
    '20250104_add_newsletter_trigger.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
    console.log(`Applying migration: ${file}`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`Migration file not found: ${file}`);
        process.exit(1);
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute SQL directly
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Successfully applied ${file}`);
    } catch (err) {
      console.error(`Error reading or executing ${file}:`, err);
      process.exit(1);
    }
  }
}

applyMigrations().catch(console.error);
