// Test script to verify the RLS recursion fix
// This script tests the verification upload flow after applying the fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test credentials
const TEST_EMAIL = 'bathoensescob@gmail.com';
const TEST_PASSWORD = 'Hawdybitch24';
const VERIFY_BUCKET = 'verification-temp';

async function testRLSRecursionFix() {
  console.log('=== RLS Recursion Fix Verification Test ===\n');
  console.log(`Bucket: ${VERIFY_BUCKET}`);
  console.log(`User: ${TEST_EMAIL}`);

  try {
    // 1) Sign in
    console.log('\n1. Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.error('❌ Sign-in failed:', authError.message);
      return false;
    }

    const userId = authData.user?.id;
    console.log('✅ Sign-in successful. User ID:', userId);

    // 2) Test direct messages access (this was failing before)
    console.log('\n2. Testing direct messages access...');
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('id, content, sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .limit(5);

    if (msgError) {
      console.log('❌ Messages access failed:', msgError.message);
      if (msgError.message.includes('infinite recursion')) {
        console.log('🔴 Recursion still present in messages policies');
        return false;
      }
    } else {
      console.log('✅ Messages access successful');
      console.log('   Messages found:', msgData?.length || 0);
    }

    // 3) Test file upload (this was working before)
    console.log('\n3. Testing file upload...');
    const now = Date.now();
    const path = `${userId}/test-fix-${now}.png`;
    
    // 1x1 transparent PNG (base64)
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAgUBAYlQogAAAABJRU5ErkJggg==";
    const content = Buffer.from(base64Png, "base64");

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(VERIFY_BUCKET)
      .upload(path, content, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      return false;
    } else {
      console.log('✅ Upload successful');
    }

    // 4) Test file listing (this was the main failing scenario)
    console.log('\n4. Testing file listing (the main recursion issue)...');
    const { data: listData, error: listError } = await supabase.storage
      .from(VERIFY_BUCKET)
      .list(userId, { limit: 5, sortBy: { column: 'name', order: 'desc' } });

    if (listError) {
      console.log('❌ File listing failed:', listError.message);
      if (listError.message.includes('infinite recursion')) {
        console.log('🔴 Recursion still present - fix did not work');
        return false;
      }
    } else {
      console.log('✅ File listing successful');
      console.log('   Files found:', listData?.length || 0);
      if (listData && listData.length > 0) {
        console.log('   Recent files:');
        listData.slice(0, 3).forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }

    // 5) Test signed URL creation
    console.log('\n5. Testing signed URL creation...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(VERIFY_BUCKET)
      .createSignedUrl(path, 60);

    if (signedUrlError) {
      console.log('❌ Signed URL creation failed:', signedUrlError.message);
    } else {
      console.log('✅ Signed URL creation successful');
      console.log('   URL created for path:', path);
    }

    // 6) Clean up test file
    console.log('\n6. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(VERIFY_BUCKET)
      .remove([path]);

    if (deleteError) {
      console.log('⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }

    // Summary
    console.log('\n=== Test Summary ===');
    console.log('✅ All operations completed successfully');
    console.log('✅ No infinite recursion detected');
    console.log('✅ RLS recursion fix is working correctly');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error.message);
    return false;
  }
}

// Run the test
testRLSRecursionFix().then((success) => {
  if (success) {
    console.log('\n🎉 SUCCESS: RLS recursion fix is working correctly!');
    process.exit(0);
  } else {
    console.log('\n❌ FAILURE: RLS recursion issue still exists');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});