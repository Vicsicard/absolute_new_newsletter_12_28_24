import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function refreshSchema() {
  try {
    // Execute raw SQL to create functions and add constraints
    const { error } = await supabase.from('_raw_sql').select('*').execute(`
      -- Function to refresh schema cache
      CREATE OR REPLACE FUNCTION schema_cache_refresh()
      RETURNS void AS $$
      BEGIN
        NOTIFY pgrst, 'reload schema';
      END;
      $$ LANGUAGE plpgsql;

      -- Function to add foreign key constraints
      CREATE OR REPLACE FUNCTION add_foreign_key_constraints()
      RETURNS void AS $$
      BEGIN
        -- Add foreign key from newsletters to companies
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'newsletters_company_id_fkey'
        ) THEN
          ALTER TABLE newsletters
          ADD CONSTRAINT newsletters_company_id_fkey
          FOREIGN KEY (company_id)
          REFERENCES companies(id)
          ON DELETE CASCADE;
        END IF;

        -- Add foreign key from newsletter_sections to newsletters
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'newsletter_sections_newsletter_id_fkey'
        ) THEN
          ALTER TABLE newsletter_sections
          ADD CONSTRAINT newsletter_sections_newsletter_id_fkey
          FOREIGN KEY (newsletter_id)
          REFERENCES newsletters(id)
          ON DELETE CASCADE;
        END IF;

        -- Add foreign key from newsletter_generation_queue to newsletters
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'newsletter_generation_queue_newsletter_id_fkey'
        ) THEN
          ALTER TABLE newsletter_generation_queue
          ADD CONSTRAINT newsletter_generation_queue_newsletter_id_fkey
          FOREIGN KEY (newsletter_id)
          REFERENCES newsletters(id)
          ON DELETE CASCADE;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    if (error) {
      console.error('Error creating functions:', error);
      process.exit(1);
    }

    console.log('SQL functions created successfully');

    // Now refresh schema and add constraints
    const { error: refreshError } = await supabase.rpc('schema_cache_refresh');
    
    if (refreshError) {
      console.error('Error refreshing schema:', refreshError);
      process.exit(1);
    }

    console.log('Schema cache refreshed successfully');

    const { error: constraintError } = await supabase.rpc('add_foreign_key_constraints');
    
    if (constraintError) {
      console.error('Error adding constraints:', constraintError);
      process.exit(1);
    }

    console.log('Foreign key constraints added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

refreshSchema();
