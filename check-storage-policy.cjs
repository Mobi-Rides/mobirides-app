
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkStoragePolicies() {
    console.log('🔒 Checking Storage Policies with Image Mime Type...');

    // 1. Create a dummy test user
    const email = `test_policy_${Date.now()}@example.com`;
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });

    if (createError) {
        console.error('Failed to create test user:', createError);
        return;
    }

    console.log(`Created test user: ${user.id}`);

    // 2. Sign in as that user
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
    });

    if (loginError) {
        console.error('Failed to login:', loginError);
        return;
    }

    // 3. Try to upload to chat-attachments
    const userClient = createClient(SUPABASE_URL, session.access_token);

    // Create a minimal PNG buffer (1x1 pixel)
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(pngBase64, 'base64');

    console.log('Attempting upload as authenticated user (USER FOLDER PATH)...');

    // Test 1: Upload to {status}/{id} folder (mimicking frontend fix)
    const path1 = `${user.id}/test_image.png`;
    const { data: data1, error: error1 } = await userClient.storage
        .from('chat-attachments')
        .upload(path1, buffer, {
            contentType: 'image/png'
        });

    if (error1) {
        console.error(`❌ Upload to ${path1} FAILED:`, error1);
    } else {
        console.log(`✅ Upload to ${path1} SUCCEEDED.`);
    }

    // Test 2: Upload to root (sanity check)
    const path2 = `root_test_${Date.now()}.png`;
    const { data: data2, error: error2 } = await userClient.storage
        .from('chat-attachments')
        .upload(path2, buffer, {
            contentType: 'image/png'
        });

    if (error2) {
        console.error(`❌ Upload to ${path2} FAILED:`, error2);
    } else {
        console.log(`✅ Upload to ${path2} SUCCEEDED.`);
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(user.id);
}

checkStoragePolicies().catch(console.error);
