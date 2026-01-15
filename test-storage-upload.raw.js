
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

async function testStorageUpload() {
    console.log('🔄 Testing Storage Upload...');

    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = 'This is a test file content uploaded via script.';

    console.log(`Uploading ${fileName}...`);

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-attachments/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Content-Type': 'text/plain',
            'x-upsert': 'true'
        },
        body: fileContent
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Upload failed:', data);
        return;
    }

    console.log('✅ Upload successful:', data);

    // Verify public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/chat-attachments/${fileName}`;
    console.log('Public URL:', publicUrl);

    // Try checking access
    const checkRes = await fetch(publicUrl);
    if (checkRes.ok) {
        console.log('✅ Public access verified.');
    } else {
        console.warn('⚠️ Public access check failed:', checkRes.status);
    }
}

testStorageUpload().catch(console.error);
