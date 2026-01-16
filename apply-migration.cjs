
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMigration() {
    console.log('🛠️ Applying migration to add "metadata" column...');

    const sql = `
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
            ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
        END IF;
    END $$;
  `;

    // Try to use a common RPC name for SQL execution if it exists
    // If not, we might be stuck without direct SQL access from node
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Failed to execute SQL via RPC:', error);
        console.log('⚠️ You may need to run the migration file manually: supabase/migrations/20260113123500_add_metadata_to_messages.sql');
    } else {
        console.log('✅ SQL executed successfully.');
    }
}

applyMigration().catch(console.error);
