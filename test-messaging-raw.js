
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

async function testMessaging() {
    console.log('🔄 Authenticatiing...');

    // 1. Sign In
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'arnold@gmail.com',
            password: 'sesco11234U'
        })
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
        console.error('❌ Login failed:', authData);
        return;
    }

    const token = authData.access_token;
    const userId = authData.user.id;
    console.log(`✅ Logged in as ${userId}`);

    // 2. Fetch Conversations
    console.log('\n🔄 Fetching conversations...');
    const convResponse = await fetch(`${SUPABASE_URL}/rest/v1/conversation_participants?select=conversation_id,conversations(*)&user_id=eq.${userId}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`
        }
    });

    const convData = await convResponse.json();

    if (!convResponse.ok) {
        console.error('❌ Failed to fetch conversations:', convData);
    } else {
        console.log(`✅ Found ${convData.length} conversations`);
        console.log(JSON.stringify(convData, null, 2));

        // Check if we have any conversation to test messaging
        if (convData.length > 0) {
            const convId = convData[0].conversation_id;

            // 3. Send Message (RPC Call or Direct Insert if allowed)
            console.log(`\n🔄 Attempting to send message to conversation ${convId}...`);

            // Try RPC first as per code analysis
            const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/send_conversation_message`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_conversation_id: convId,
                    p_content: "Test message from raw script " + new Date().toISOString(),
                    p_message_type: "text",
                    p_metadata: {}
                })
            });

            const rpcData = await rpcResponse.json();

            if (!rpcResponse.ok) {
                console.error('❌ RPC Send failed:', rpcData);

                // Fallback to direct insert if RPC fails (though RPC is preferred)
                console.log('⚠️ RPC failed, this might differ from frontend logic.');
            } else {
                console.log('✅ Message sent via RPC:', rpcData);
            }
        } else {
            console.warn('⚠️ No conversations found, cannot test sending messages.');
        }
    }
}

testMessaging().catch(console.error);
