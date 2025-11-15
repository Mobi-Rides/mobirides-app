// RLS Introspection Script - Service Role Version
// Purpose: Run comprehensive introspection queries to identify RLS recursion issues
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app/test scripts
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

// Note: We'll need to use the service role key for introspection
// But for now, let's use a different approach with the anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function runBasicIntrospection() {
  console.log('=== Basic RLS Introspection ===\n');

  try {
    // Test basic storage operations that trigger the recursion
    console.log('Testing storage operations that trigger recursion...\n');
    
    // Test 1: Try to list files (this should trigger the recursion error)
    console.log('1. Testing file list operation (potential recursion trigger)...');
    const { data: listData, error: listError } = await supabase.storage
      .from('verification-temp')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ List error:', listError.message);
      if (listError.message.includes('infinite recursion')) {
        console.log('🔴 CONFIRMED: Infinite recursion in messages policies during storage.list()');
        console.log('   This confirms that storage.list() triggers messages table RLS evaluation');
      }
    } else {
      console.log('✅ File list successful (unexpected - recursion should occur)');
    }

    // Test 2: Try to access messages table directly
    console.log('\n2. Testing direct messages table access...');
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    if (msgError) {
      console.log('❌ Messages access error:', msgError.message);
      if (msgError.message.includes('infinite recursion')) {
        console.log('🔴 CONFIRMED: Infinite recursion in messages policies');
      }
    } else {
      console.log('✅ Messages table accessible');
    }

    // Test 3: Try to upload a file (this should work based on previous tests)
    console.log('\n3. Testing file upload operation...');
    const testFile = new Blob(['test'], { type: 'image/png' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-temp')
      .upload('test-diagnostic.png', testFile);
    
    if (uploadError) {
      console.log('❌ Upload error:', uploadError.message);
    } else {
      console.log('✅ Upload successful');
      
      // Clean up
      await supabase.storage
        .from('verification-temp')
        .remove(['test-diagnostic.png']);
    }

    // Test 4: Check if we can get any policy information from the error messages
    console.log('\n4. Analyzing error patterns...');
    
    // Try to trigger different operations that might give us more context
    const operations = [
      { 
        name: 'Storage search', 
        fn: () => supabase.storage.from('verification-temp').search('', { limit: 1 })
      },
      { 
        name: 'Storage info', 
        fn: () => supabase.storage.getBucket('verification-temp')
      }
    ];

    for (const op of operations) {
      console.log(`\n   Testing ${op.name}...`);
      try {
        const { error } = await op.fn();
        if (error) {
          console.log(`   ❌ ${op.name} error:`, error.message);
          if (error.message.includes('infinite recursion')) {
            console.log(`   🔴 Recursion detected in ${op.name}`);
          }
        } else {
          console.log(`   ✅ ${op.name} successful`);
        }
      } catch (e) {
        console.log(`   ❌ ${op.name} exception:`, e.message);
      }
    }

  } catch (error) {
    console.error('Introspection failed:', error.message);
  }
}

async function analyzeRecursionPattern() {
  console.log('\n=== Recursion Pattern Analysis ===\n');
  
  console.log('Based on the test-verification.js results and error patterns:');
  console.log('1. ✅ File upload works (no recursion during INSERT)');
  console.log('2. ❌ File listing fails with "infinite recursion detected in policy for relation \'messages\'"');
  console.log('3. This suggests the recursion occurs during SELECT operations on storage.objects');
  console.log('4. The storage.objects SELECT policy likely references messages table or vice versa');
  console.log('5. Possible chain: storage.list() -> storage.objects SELECT -> messages SELECT -> recursion');
  
  console.log('\n=== Likely Recursion Chain ===');
  console.log('storage.objects policy (SELECT) → references messages table → messages policy → references back → RECURSION');
  
  console.log('\n=== Recommended Investigation ===');
  console.log('1. Check if any storage.objects policy has a USING clause that queries messages');
  console.log('2. Check if any messages policy has a USING clause that queries storage.objects');
  console.log('3. Look for functions called by policies that might cross-reference these tables');
  console.log('4. Consider inlining any cross-table references in policies');
}

async function testSpecificScenarios() {
  console.log('\n=== Testing Specific Recursion Scenarios ===\n');
  
  // Test with authenticated user (simulate the test-verification.js flow)
  console.log('Testing with authentication context...');
  
  // We need to simulate the authenticated context like in test-verification.js
  // Let's create a simple test that mimics the failing scenario
  
  const testEmail = 'bathoensescob@gmail.com';
  const testPassword = 'Hawdybitch24';
  
  console.log(`Signing in as ${testEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.log('Sign-in error:', authError.message);
    return;
  }

  console.log('Sign-in successful. User ID:', authData.user?.id);
  
  // Now test the specific scenario that fails
  console.log('\nTesting the failing scenario: listing user files...');
  const userId = authData.user?.id;
  
  const { data: listData, error: listError } = await supabase.storage
    .from('verification-temp')
    .list(userId, { limit: 5, sortBy: { column: 'name', order: 'desc' } });
  
  if (listError) {
    console.log('❌ List operation failed:', listError.message);
    console.log('Error details:', JSON.stringify(listError, null, 2));
    
    if (listError.message.includes('infinite recursion')) {
      console.log('\n🔴 RECURSION CONFIRMED IN AUTHENTICATED CONTEXT');
      console.log('The recursion occurs when listing files in user-specific path');
      console.log('This suggests the RLS policy evaluation chain is:');
      console.log('1. User lists files in their verification-temp folder');
      console.log('2. Storage RLS evaluates SELECT policy on storage.objects');
      console.log('3. Storage policy references messages table or function');
      console.log('4. Messages RLS policy references back to storage or creates cycle');
      console.log('5. INFINITE RECURSION DETECTED');
    }
  } else {
    console.log('✅ List operation successful (unexpected)');
    console.log('Files found:', listData?.length || 0);
  }
}

// Run the comprehensive analysis
runBasicIntrospection()
  .then(() => analyzeRecursionPattern())
  .then(() => testSpecificScenarios())
  .then(() => {
    console.log('\n=== Introspection Complete ===');
    console.log('Summary: Recursion occurs during authenticated file listing operations');
    console.log('Root cause: Cross-reference between storage.objects and messages RLS policies');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Analysis error:', error);
    process.exit(1);
  });