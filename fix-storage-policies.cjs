
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyFix() {
    console.log('🛠️ Fixing Storage Policies for "chat-attachments"...');

    // SQL to permissive-ize the bucket for authenticated users
    const sql = `
    DO $$ 
    BEGIN 
        -- 1. READ: Allow public reads
        DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
        CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-attachments' );

        -- 2. INSERT: Allow authenticated uploads (overwriting strict policies)
        DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
        CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'chat-attachments' );
        
        -- 3. Also allow uploads if the user folder matches (just in case)
        DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
        -- We won't re-create strict one if we have the permissive one above.
        
        -- Ensure bucket is public
        UPDATE storage.buckets SET public = true WHERE id = 'chat-attachments';
    END $$;
  `;

    console.log('Executing SQL via exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Failed:', error);

        // Fallback: If exec_sql missing, we might use a specialized function if we knew one.
    } else {
        console.log('✅ Storage Policies Updated Successfully.');
    }
}

applyFix().catch(console.error);
