import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync } from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration(sql: string) {
  try {
    // Execute the SQL directly using a raw query
    const { data, error } = await supabase.from('_raw_sql').select('*').execute(sql);
    if (error) throw error;
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  }
}

async function applyMigrations() {
  try {
    // Get the directory of the current module
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Get all SQL files in the migrations directory
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Create schema_cache_refresh function first
    const schemaCacheFunc = `
      CREATE OR REPLACE FUNCTION schema_cache_refresh()
      RETURNS void AS $$
      BEGIN
        NOTIFY pgrst, 'reload schema';
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await applyMigration(schemaCacheFunc);
    console.log('Created schema_cache_refresh function');

    // Apply each migration
    for (const file of files) {
      console.log(`Applying migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      await applyMigration(sql);
    }

    // Refresh schema cache after all migrations
    await applyMigration('SELECT schema_cache_refresh();');
    console.log('Schema cache refreshed');

  } catch (error) {
    console.error('Error in migrations:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations().catch(console.error);
