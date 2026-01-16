
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('🔍 Checking "conversation_messages" table schema...');

    const { data, error } = await supabase
        .from('conversation_messages')
        .select('metadata')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            console.log('❌ Column "metadata" DOES NOT exist in "conversation_messages".');
            console.error('Error details:', error);
        } else if (error.code === 'PGRST205') {
            console.log('❌ Table "conversation_messages" DOES NOT exist.');
            console.error('Error details:', error);
        } else {
            console.log('✅ Column "metadata" likely exists (query succeeded or error unrelated to schema).');
            console.log('Query result/error:', error || data);
        }
    } else {
        console.log('✅ Column "metadata" exists in "conversation_messages".');
    }
}

checkSchema().catch(console.error);
