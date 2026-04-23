
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

// Initialize Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test Data
const SENDER_EMAIL = 'arnold@gmail.com';
const RECIPIENT_EMAIL = 'test_recipient@example.com';

async function runTest() {
    console.log('🚀 Starting Messaging Module Verification Check (Direct DB Access)...');

    try {
        // 1. Get Users
        console.log('\n👤 Verifying Users...');
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) throw userError;

        let sender = users.find(u => u.email === SENDER_EMAIL);
        let recipient = users.find(u => u.email === RECIPIENT_EMAIL);

        // Create Sender if missing
        if (!sender) {
            // ... (creation logic same as before)
            console.log(`Creating sender ${SENDER_EMAIL}...`);
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: SENDER_EMAIL,
                password: 'password123',
                email_confirm: true
            });
            if (error) throw error;
            sender = data.user;
        }
        console.log(`✅ Sender: ${sender.id}`);

        // Create Recipient if missing
        if (!recipient) {
            // ... (creation logic same as before)
            console.log(`Creating recipient ${RECIPIENT_EMAIL}...`);
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: RECIPIENT_EMAIL,
                password: 'password123',
                email_confirm: true
            });
            if (error) throw error;
            recipient = data.user;
        }
        console.log(`✅ Recipient: ${recipient.id}`);

        // 2. Create Conversation (Direct Insert)
        console.log('\n💬 Creating Conversation (Direct Insert)...');

        // Check existing participants first to reuse
        const { data: existingConvs } = await supabaseAdmin
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', sender.id);

        let activeConversationId;

        if (existingConvs && existingConvs.length > 0) {
            // Just grab the first one for simplicity in this test environment
            activeConversationId = existingConvs[0].conversation_id;
            console.log(`⚠️ Using existing conversation: ${activeConversationId}`);
        } else {
            // Create new
            const { data: conv, error: createError } = await supabaseAdmin
                .from('conversations')
                .insert({
                    type: 'direct',
                    title: null
                })
                .select() // Need to select to get ID
                .single();

            if (createError) throw createError;
            activeConversationId = conv.id;

            // Add participants
            const { error: partError } = await supabaseAdmin
                .from('conversation_participants')
                .insert([
                    { conversation_id: activeConversationId, user_id: sender.id },
                    { conversation_id: activeConversationId, user_id: recipient.id }
                ]);

            if (partError) throw partError;
            console.log(`✅ New conversation created: ${activeConversationId}`);
        }

        // 3. Send Text Message (Direct Insert)
        console.log('\n📨 Sending TEXT Message...');
        const { data: textMsg, error: textError } = await supabaseAdmin
            .from('conversation_messages')
            .insert({
                conversation_id: activeConversationId,
                sender_id: sender.id,
                content: 'Hello from Admin Test',
                message_type: 'text'
            })
            .select()
            .single();

        if (textError) throw textError;
        console.log(`✅ Text Message Sent: ${textMsg.id}`);

        // 4. Send IMAGE Message
        console.log('\n🖼️ Sending IMAGE Message...');
        const imageMetadata = {
            url: 'https://placehold.co/600x400',
            fileName: 'test.png',
            fileSize: 1024,
            mimeType: 'image/png'
        };

        const { data: imgMsg, error: imgError } = await supabaseAdmin
            .from('conversation_messages')
            .insert({
                conversation_id: activeConversationId,
                sender_id: sender.id,
                content: 'Image content',
                message_type: 'image',
                metadata: imageMetadata
            })
            .select()
            .single();

        if (imgError) throw imgError;
        console.log(`✅ Image Message Sent: ${imgMsg.id}`);
        console.log(`   Metadata Present: ${!!imgMsg.metadata}`);

        // 5. Send FILE Message
        console.log('\nVk Sending FILE Message...');
        const fileMetadata = {
            url: 'https://example.com/file.pdf',
            fileName: 'file.pdf',
            fileSize: 5000,
            mimeType: 'application/pdf'
        };

        const { data: fileMsg, error: fileError } = await supabaseAdmin
            .from('conversation_messages')
            .insert({
                conversation_id: activeConversationId,
                sender_id: sender.id,
                content: 'File content',
                message_type: 'file',
                metadata: fileMetadata
            })
            .select()
            .single();

        if (fileError) throw fileError;
        console.log(`✅ File Message Sent: ${fileMsg.id}`);
        console.log(`   Metadata Present: ${!!fileMsg.metadata}`);

        console.log('\n🎉 Verification Complete!');

    } catch (err) {
        console.error('\n❌ Error:', err);
    }
}

runTest();
