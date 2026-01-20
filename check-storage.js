
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

async function checkStorage() {
    console.log('🔄 Checking Supabase Storage buckets...');

    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
        }
    });

    const buckets = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to list buckets:', buckets);
        return;
    }

    console.log(`Found ${buckets.length} buckets.`);
    const attachmentBucket = buckets.find(b => b.id === 'chat-attachments');

    if (attachmentBucket) {
        console.log('✅ Bucket "chat-attachments" exists.');
        console.log('Is Public:', attachmentBucket.public);
    } else {
        console.log('⚠️ Bucket "chat-attachments" DOES NOT exist. Creating...');

        const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 'chat-attachments',
                name: 'chat-attachments',
                public: true, // Make public for easier access, or false if using signed URLs
                file_size_limit: 52428800, // 50MB
                allowed_mime_types: ['image/*', 'application/pdf', 'text/plain']
            })
        });

        const createData = await createRes.json();
        if (createRes.ok) {
            console.log('✅ Created bucket "chat-attachments":', createData);
        } else {
            console.error('❌ Failed to create bucket:', createData);
        }
    }
}

checkStorage().catch(console.error);
