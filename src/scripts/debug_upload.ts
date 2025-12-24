
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
let envConfig = {};
if (fs.existsSync(envLocalPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
} else if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
}
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

// Use Service Key to bypass RLS for this specific connectivity test initially
// OR use Anon key if we can simulate a user (harder in script)
// Let's use Service Key first to rule out bucket config issues.
const supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY);

async function testUpload() {
    console.log('--- TESTING UPLOAD ---');
    const bucketName = 'insurance-claims';
    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = Buffer.from('Test content for upload debug', 'utf-8');

    console.log(`Attempting to upload to bucket: ${bucketName}`);

    // 1. Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('Failed to list buckets:', bucketError);
        return;
    }

    const insuranceBucket = buckets.find(b => b.name === bucketName);
    if (!insuranceBucket) {
        console.error(`❌ Bucket '${bucketName}' NOT FOUND in list! Available:`, buckets.map(b => b.name));
        return;
    }
    console.log(`✅ Bucket '${bucketName}' exists.`);

    // 2. Upload file
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (error) {
        console.error('❌ Upload Failed:', error);
    } else {
        console.log('✅ Upload Successful:', data);
        // Cleanup
        await supabase.storage.from(bucketName).remove([fileName]);
    }
}

testUpload();
