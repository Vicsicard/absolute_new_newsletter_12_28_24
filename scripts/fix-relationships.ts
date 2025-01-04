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

async function fixRelationships() {
  try {
    // Drop and recreate constraints in a single transaction
    const sql = `
      BEGIN;

      -- Drop existing constraints if they exist
      DO $$ 
      BEGIN
        -- Drop newsletter_sections constraints
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'newsletter_sections_newsletter_id_fkey') THEN
          ALTER TABLE newsletter_sections DROP CONSTRAINT newsletter_sections_newsletter_id_fkey;
        END IF;

        -- Drop newsletters constraints
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'newsletters_company_id_fkey') THEN
          ALTER TABLE newsletters DROP CONSTRAINT newsletters_company_id_fkey;
        END IF;

        -- Drop queue constraints
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'newsletter_generation_queue_newsletter_id_fkey') THEN
          ALTER TABLE newsletter_generation_queue DROP CONSTRAINT newsletter_generation_queue_newsletter_id_fkey;
        END IF;
      END $$;

      -- Add newsletter to company relationship
      ALTER TABLE newsletters 
      ADD CONSTRAINT newsletters_company_id_fkey 
      FOREIGN KEY (company_id) 
      REFERENCES companies(id) 
      ON DELETE CASCADE;

      -- Add sections to newsletter relationship
      ALTER TABLE newsletter_sections 
      ADD CONSTRAINT newsletter_sections_newsletter_id_fkey 
      FOREIGN KEY (newsletter_id) 
      REFERENCES newsletters(id) 
      ON DELETE CASCADE;

      -- Add queue to newsletter relationship
      ALTER TABLE newsletter_generation_queue 
      ADD CONSTRAINT newsletter_generation_queue_newsletter_id_fkey 
      FOREIGN KEY (newsletter_id) 
      REFERENCES newsletters(id) 
      ON DELETE CASCADE;

      -- Notify PostgREST to reload schema
      NOTIFY pgrst, 'reload schema';

      COMMIT;
    `;

    const { data, error } = await supabase.auth.admin.executeRawSql({ sql });
    
    if (error) {
      console.error('Error fixing relationships:', error);
      process.exit(1);
    }

    console.log('Successfully fixed database relationships');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRelationships();
