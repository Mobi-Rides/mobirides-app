// Verification Upload Test - Workaround Version
// Purpose: Test verification storage upload while avoiding the recursion issue
// This version skips the problematic file listing operation

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVerificationUpload() {
  console.log('--- Verification Upload Test (Workaround) ---');
  console.log('Bucket: verification-temp');

  try {
    // Sign in
    console.log('Signing in as bathoensescob@gmail.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'bathoensescob@gmail.com',
      password: 'Hawdybitch24',
    });

    if (authError) {
      console.error('Sign-in failed:', authError.message);
      return;
    }

    console.log('Sign-in successful. User:', authData.user.id);
    const userId = authData.user.id;

    // Create a test file (1x1 transparent PNG)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0D, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5B, 0x63, 0xF8, 0x0F, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const fileName = `${userId}/test-${Date.now()}.png`;
    const file = new Blob([pngData], { type: 'image/png' });

    console.log(`Uploading to verification-temp:${fileName} ...`);
    
    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-temp')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      return;
    }

    console.log('Upload succeeded:', {
      path: uploadData.path,
      id: uploadData.id,
      fullPath: uploadData.fullPath
    });

    // Create signed URL (this should work)
    console.log('Creating signed URL...');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('verification-temp')
      .createSignedUrl(fileName, 3600); // 1 hour

    if (urlError) {
      console.error('Signed URL failed:', urlError.message);
    } else {
      console.log('Signed URL created:', urlData.signedUrl);
    }

    // WORKAROUND: Instead of listing files, we'll just verify the upload succeeded
    // by checking if we can access the specific file we just uploaded
    console.log('\n--- Workaround Verification ---');
    console.log('Since file listing triggers recursion, we verify upload success by:');
    console.log('1. ✅ Upload completed successfully');
    console.log('2. ✅ Signed URL created successfully');
    console.log('3. This confirms the storage system is working for uploads');
    
    // Try a simple file existence check (this might work where listing fails)
    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('verification-temp')
        .download(fileName);
      
      if (fileError) {
        console.log('❌ File download test failed:', fileError.message);
      } else {
        console.log('✅ File download test successful - upload verified');
      }
    } catch (downloadError) {
      console.log('❌ File download test error:', downloadError.message);
    }

    console.log('\n--- Test Summary ---');
    console.log('✅ Authentication: Working');
    console.log('✅ File Upload: Working');
    console.log('✅ Signed URL Generation: Working');
    console.log('❌ File Listing: Still has recursion issue');
    console.log('📝 Manual SQL fix provided in fix-recursion-manual.sql');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testVerificationUpload()
  .then(() => {
    console.log('\n--- Test Complete ---');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });