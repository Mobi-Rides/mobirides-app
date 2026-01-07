
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_KEY) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

// Admin client for cleanup/setup
const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTest() {
    console.log('🔒 Starting RLS Upload Verification...');

    const testEmail = `upload-test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Create User
    console.log(`👤 Creating test user: ${testEmail}`);
    const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
    });
    if (createError) throw createError;
    const userId = userData.user.id;

    try {
        // 2. Sign In (Get Session)
        console.log('🔑 Signing in as user...');
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: sessionData, error: signInError } = await userClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        if (signInError) throw signInError;

        // 3. Attempt Invalid Upload (Wrong Path)
        console.log('🚫 TEST 1: Attempting Invalid Path Upload (Should Fail)...');
        const invalidPath = `claims/some-policy/${Date.now()}.pdf`;
        // Use a fake PDF header to satisfy MIME checks if Supabase performs deep inspection (usually just content-type header)
        const pdfBuffer = Buffer.from('%PDF-1.4\n%...', 'utf-8');

        const { error: invalidError } = await userClient.storage
            .from('insurance-claims')
            .upload(invalidPath, pdfBuffer, { upsert: true, contentType: 'application/pdf' });

        if (invalidError) {
            console.log('   ✅ Received expected error:', invalidError.message);
        } else {
            console.error('   ❌ Invalid upload SUCCEEDED! RLS is not enforcing path check.');
            throw new Error('RLS check failed (Invalid Path)');
        }

        // 4. Attempt Valid Upload (Correct Path with User ID)
        console.log('✅ TEST 2: Attempting Valid Path Upload (Should Succeed)...');
        const validPath = `${userId}/claims/some-policy/${Date.now()}.pdf`;
        const { data: validData, error: validError } = await userClient.storage
            .from('insurance-claims')
            .upload(validPath, pdfBuffer, { upsert: true, contentType: 'application/pdf' });

        if (validError) {
            console.error('   ❌ Valid upload FAILED:', validError);
            throw validError;
        }
        console.log('   ✅ Upload Succeeded:', validData.path);

    } finally {
        // Cleanup
        console.log('🧹 Cleanup user...');
        await adminSupabase.auth.admin.deleteUser(userId);
    }

    console.log('✨ RLS Verification Complete!');
}

runTest().catch(e => {
    console.error('❌ Test Failed:', e);
    process.exit(1);
});
