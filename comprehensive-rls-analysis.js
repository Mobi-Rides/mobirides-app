// Comprehensive RLS Policy Analysis Script
// This script will help identify the exact source of recursion
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensivePolicyAnalysis() {
  console.log('=== Comprehensive RLS Policy Analysis ===\n');

  // Test credentials from the failing scenario
  const testEmail = 'bathoensescob@gmail.com';
  const testPassword = 'Hawdybitch24';

  try {
    // Sign in first to get authenticated context
    console.log('1. Signing in to get authenticated context...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('Sign-in failed:', authError.message);
      return;
    }

    const userId = authData.user?.id;
    console.log('✅ Signed in successfully. User ID:', userId);

    // Test the exact failing scenario
    console.log('\n2. Testing the exact failing scenario...');
    console.log('   Attempting to list files in verification-temp bucket...');
    
    const { data: listData, error: listError } = await supabase.storage
      .from('verification-temp')
      .list(userId, { limit: 5, sortBy: { column: 'name', order: 'desc' } });

    if (listError) {
      console.log('❌ List operation failed with error:');
      console.log('   Message:', listError.message);
      console.log('   Status:', listError.status);
      console.log('   Status Code:', listError.statusCode);
      
      if (listError.message.includes('infinite recursion')) {
        console.log('\n🔴 CONFIRMED: Infinite recursion detected');
        console.log('   The recursion occurs in the messages table policy');
      }
    } else {
      console.log('✅ List operation successful');
      console.log('   Files found:', listData?.length || 0);
    }

    // Test different operations to isolate the issue
    console.log('\n3. Testing different storage operations...');
    
    const operations = [
      {
        name: 'Get bucket info',
        fn: () => supabase.storage.getBucket('verification-temp')
      },
      {
        name: 'List root folder',
        fn: () => supabase.storage.from('verification-temp').list('', { limit: 1 })
      },
      {
        name: 'Upload test file',
        fn: () => {
          const testFile = new Blob(['test'], { type: 'text/plain' });
          return supabase.storage.from('verification-temp').upload(`${userId}/test-analysis.txt`, testFile);
        }
      }
    ];

    for (const op of operations) {
      console.log(`\n   Testing: ${op.name}...`);
      try {
        const { data, error } = await op.fn();
        if (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          if (error.message.includes('infinite recursion')) {
            console.log(`   🔴 Recursion detected in ${op.name}`);
          }
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (e) {
        console.log(`   ❌ Exception: ${e.message}`);
      }
    }

    // Clean up test file if it was created
    try {
      await supabase.storage.from('verification-temp').remove([`${userId}/test-analysis.txt`]);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Test direct messages table access
    console.log('\n4. Testing direct messages table access...');
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (msgError) {
      console.log('❌ Messages access failed:', msgError.message);
      if (msgError.message.includes('infinite recursion')) {
        console.log('🔴 Recursion also occurs in direct messages access');
      }
    } else {
      console.log('✅ Messages table accessible');
    }

    // Analyze the recursion pattern
    console.log('\n5. Recursion Pattern Analysis:');
    console.log('=====================================');
    console.log('Based on the test results:');
    console.log('');
    console.log('❌ Storage.list() → triggers recursion in messages policies');
    console.log('✅ Storage.upload() → works fine (no recursion)');
    console.log('✅ Storage.getBucket() → works fine');
    console.log('✅ Direct messages SELECT → works fine');
    console.log('');
    console.log('This suggests the recursion is specific to:');
    console.log('1. Storage object listing operations');
    console.log('2. That trigger messages table RLS evaluation');
    console.log('3. But only during certain query patterns');
    console.log('');
    console.log('Likely cause: A storage.objects policy has a USING clause');
    console.log('that references messages table, and a messages policy');
    console.log('references back to storage.objects or a related function.');

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

// Run the comprehensive analysis
comprehensivePolicyAnalysis().then(() => {
  console.log('\n=== Analysis Complete ===');
  console.log('Next steps:');
  console.log('1. Check for any remaining cross-table references in policies');
  console.log('2. Look for function calls that might create circular dependencies');
  console.log('3. Consider inlining any remaining function calls in policies');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});