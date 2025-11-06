// Test script to exercise the verification storage upload flow
// Mirrors project test style and uses the same Supabase credentials as test-signin.js
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app/test scripts
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@mobirides.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const VERIFY_BUCKET = process.env.VERIFY_BUCKET || 'verification-temp';

async function runVerificationUploadTest() {
  console.log('--- Verification Upload Test ---');
  console.log(`Bucket: ${VERIFY_BUCKET}`);

  // 1) Sign in
  console.log(`Signing in as ${TEST_EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    console.error('Sign-in error:', authError.message);
    console.error('Details:', authError);
    process.exitCode = 1;
    return;
  }

  console.log('Sign-in successful. User:', authData.user?.id);

  // 2) Upload a small test file to the verification bucket
  const now = Date.now();
  const userId = authData.user?.id ?? "unknown-user";
  // Use allowed MIME type and user-scoped folder per RLS (image/png)
  const path = `${userId}/test-${now}.png`;
  // 1x1 transparent PNG (base64)
  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgUBAYlQogAAAABJRU5ErkJggg==";
  const content = Buffer.from(base64Png, "base64");

  console.log(`Uploading to ${VERIFY_BUCKET}:${path} ...`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(VERIFY_BUCKET)
    .upload(path, content, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError.message);
    console.error('Full error:', uploadError);
    process.exitCode = 1;
    return;
  }

  console.log('Upload succeeded:', uploadData);

  // 3) List the user's folder to verify visibility (RLS enforces first segment = userId)
  console.log('Listing recent test files in user folder...');
  const { data: listData, error: listError } = await supabase.storage
    .from(VERIFY_BUCKET)
    .list(userId, { limit: 5, sortBy: { column: 'name', order: 'desc' } });

  if (listError) {
    console.error('List error:', listError.message);
    console.error('Full error:', listError);
    process.exitCode = 1;
    return;
  }

  console.log(`Files in ${userId}/:`, listData);

  // 4) Create a short-lived signed URL for the uploaded file
  console.log('Creating signed URL for uploaded file...');
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(VERIFY_BUCKET)
    .createSignedUrl(path, 60);

  if (signedUrlError) {
    console.error('Signed URL error:', signedUrlError.message);
    console.error('Full error:', signedUrlError);
    process.exitCode = 1;
    return;
  }

  console.log('Signed URL:', signedUrlData?.signedUrl);
  console.log('--- Verification Upload Test Completed ---');
}

runVerificationUploadTest().catch((err) => {
  console.error('Unexpected failure:', err);
  process.exitCode = 1;
});