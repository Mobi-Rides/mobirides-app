const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

// Initialize Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test User
const TEST_USER_EMAIL = 'bathoensescob@gmail.com';
const SEARCH_TERM = 'boitumelo';

async function testSearchFunctionality() {
    console.log('🔍 Testing Search Functionality...\n');

    try {
        // 1. Get the test user
        console.log(`👤 Finding user: ${TEST_USER_EMAIL}...`);
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) throw userError;

        const testUser = users.find(u => u.email === TEST_USER_EMAIL);
        if (!testUser) {
            throw new Error(`User ${TEST_USER_EMAIL} not found`);
        }
        console.log(`✅ User found: ${testUser.id}\n`);

        // 2. Find conversations the user is part of
        console.log('💬 Finding user conversations...');
        const { data: participations, error: partError } = await supabaseAdmin
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', testUser.id);

        if (partError) throw partError;

        if (!participations || participations.length === 0) {
            console.log('❌ User has no conversations');
            return;
        }

        const conversationIds = participations.map(p => p.conversation_id);
        console.log(`✅ Found ${conversationIds.length} conversations\n`);

        // 3. Get all participants with profiles to find "boitumelo"
        console.log(`🔍 Searching for participant containing "${SEARCH_TERM}"...`);
        const { data: allParticipants, error: allPartError } = await supabaseAdmin
            .from('conversation_participants')
            .select(`
                conversation_id,
                user_id,
                profiles:user_id (
                    id,
                    full_name,
                    email
                )
            `)
            .in('conversation_id', conversationIds);

        if (allPartError) throw allPartError;

        // Find participants matching search term
        const matchingParticipants = allParticipants.filter(p =>
            p.profiles?.full_name?.toLowerCase().includes(SEARCH_TERM.toLowerCase())
        );

        console.log(`✅ Found ${matchingParticipants.length} participants matching "${SEARCH_TERM}":`);
        matchingParticipants.forEach(p => {
            console.log(`   - ${p.profiles?.full_name} (${p.profiles?.email}) in conversation ${p.conversation_id}`);
        });

        // 4. Search conversations by title (current implementation)
        console.log(`\n📋 Searching conversations by title containing "${SEARCH_TERM}"...`);
        const { data: conversations, error: convError } = await supabaseAdmin
            .from('conversations')
            .select('id, title, type, updated_at')
            .in('id', conversationIds);

        if (convError) throw convError;

        const matchingByTitle = conversations.filter(c =>
            c.title?.toLowerCase().includes(SEARCH_TERM.toLowerCase())
        );

        console.log(`✅ Found ${matchingByTitle.length} conversations with title matching "${SEARCH_TERM}"`);
        matchingByTitle.forEach(c => {
            console.log(`   - Conv: ${c.id} | Title: "${c.title}" | Type: ${c.type}`);
        });

        // 5. Search messages containing the search term
        console.log(`\n📨 Searching messages containing "${SEARCH_TERM}"...`);
        const { data: messages, error: msgError } = await supabaseAdmin
            .from('conversation_messages')
            .select(`
                id,
                content,
                sender_id,
                conversation_id,
                created_at,
                sender:profiles!sender_id (
                    full_name
                )
            `)
            .in('conversation_id', conversationIds)
            .ilike('content', `%${SEARCH_TERM}%`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (msgError) throw msgError;

        console.log(`✅ Found ${messages?.length || 0} messages containing "${SEARCH_TERM}":`);
        (messages || []).forEach(m => {
            console.log(`   - [${m.created_at}] ${m.sender?.full_name}: "${m.content.substring(0, 50)}..."`);
        });

        // 6. Test conversation list filtering (simulating frontend behavior)
        console.log('\n📝 Simulating frontend conversation filter...');

        // Get full conversation data like the frontend does
        const { data: fullConversations, error: fullConvError } = await supabaseAdmin
            .from('conversations')
            .select('id, title, type, updated_at, last_message_at')
            .in('id', conversationIds)
            .order('updated_at', { ascending: false });

        if (fullConvError) throw fullConvError;

        // Get last messages for each conversation
        const { data: lastMessages, error: lastMsgError } = await supabaseAdmin
            .from('conversation_messages')
            .select('id, content, conversation_id, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

        if (lastMsgError) throw lastMsgError;

        // Group last message by conversation
        const lastMessageByConv = {};
        lastMessages.forEach(m => {
            if (!lastMessageByConv[m.conversation_id]) {
                lastMessageByConv[m.conversation_id] = m;
            }
        });

        // Apply filter like frontend does (title or last message content)
        const filteredConversations = fullConversations.filter(conv => {
            // Check title
            const titleMatch = conv.title?.toLowerCase().includes(SEARCH_TERM.toLowerCase());

            // Check last message content
            const lastMsg = lastMessageByConv[conv.id];
            const lastMsgMatch = lastMsg?.content?.toLowerCase().includes(SEARCH_TERM.toLowerCase());

            // Check participants (this is what the frontend SHOULD do but may not be doing)
            const convParticipants = allParticipants.filter(p => p.conversation_id === conv.id);
            const participantMatch = convParticipants.some(p =>
                p.profiles?.full_name?.toLowerCase().includes(SEARCH_TERM.toLowerCase())
            );

            return titleMatch || lastMsgMatch || participantMatch;
        });

        console.log(`✅ Frontend filter results: ${filteredConversations.length} conversations`);
        filteredConversations.forEach(c => {
            const lastMsg = lastMessageByConv[c.id];
            const participants = allParticipants
                .filter(p => p.conversation_id === c.id)
                .map(p => p.profiles?.full_name)
                .join(', ');
            console.log(`   - Conv ${c.id.substring(0, 8)}...`);
            console.log(`     Title: "${c.title || 'Direct Message'}"`);
            console.log(`     Participants: ${participants}`);
            console.log(`     Last Message: "${lastMsg?.content?.substring(0, 40) || 'None'}..."`);
        });

        console.log('\n🎉 Search Test Complete!');

    } catch (err) {
        console.error('\n❌ Error:', err);
    }
}

testSearchFunctionality();
