import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://odjvatrrqyuspcjxlnki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kanZhdHJycXl1c3BjanhsbmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA2MTMwMiwiZXhwIjoyMDUwNjM3MzAyfQ.SmLRECO23Odm3d_sLH4Om9pQFkhmWOro5-1q07K0n70';

async function applyMigrations() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First create the exec_sql function
  const createExecSql = `
    create or replace function exec_sql(sql text)
    returns void
    language plpgsql
    security definer
    as $$
    begin
      execute sql;
    end;
    $$;
  `;

  console.log('Creating exec_sql function...');
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createExecSql });
  
  if (createError) {
    console.log('Exec_sql function already exists or error creating it:', createError);
    console.log('Proceeding with migrations...');
  }

  // Read and execute the migration files
  const migrationFiles = [
    '20250103_add_trigger_functions.sql',
    '20250103_add_newsletter_triggers.sql',
    '20250103_refresh_triggers.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
    console.log(`Applying migration: ${file}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
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
