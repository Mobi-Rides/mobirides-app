
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('🔍 Checking "messages" table schema...');

    // We can't directly query schema via JS client easily without SQL editor or specific permissions/functions.
    // But we can try to select 'metadata' from 'messages' and see if it errors.

    const { data, error } = await supabase
        .from('messages')
        .select('metadata')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting metadata:', error);
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            console.log('⚠️ Column "metadata" likely missing.');
        }
    } else {
        console.log('✅ Column "metadata" exists.');
        console.log('Sample data:', data);
    }
}

checkSchema().catch(console.error);
