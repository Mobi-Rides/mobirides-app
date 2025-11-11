// RLS Introspection Script
// Purpose: Run comprehensive introspection queries to identify RLS recursion issues
import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app/test scripts
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Introspection queries
const introspectionQueries = [
  {
    name: "Messages RLS Policies",
    query: `
      SELECT 
          schemaname,
          tablename,
          policyname,
          cmd,
          roles,
          qual,  -- USING clause (for SELECT/UPDATE/DELETE)
          with_check  -- WITH CHECK clause (for INSERT/UPDATE)
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'messages'
      ORDER BY policyname;
    `
  },
  {
    name: "Storage Objects RLS Policies",
    query: `
      SELECT 
          schemaname,
          tablename,
          policyname,
          cmd,
          roles,
          qual,
          with_check
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname;
    `
  },
  {
    name: "Function-based Policy Checks",
    query: `
      SELECT 
          p.policyname,
          p.tablename,
          p.cmd,
          CASE 
              WHEN p.qual ~ '\\w+\\s*\\(' THEN 'Function calls in USING clause'
              WHEN p.with_check ~ '\\w+\\s*\\(' THEN 'Function calls in WITH CHECK clause'
              ELSE 'No function calls detected'
          END as function_status,
          p.qual as using_clause,
          p.with_check as check_clause
      FROM pg_policies p
      WHERE p.schemaname IN ('public', 'storage')
          AND p.tablename IN ('messages', 'objects', 'profiles', 'conversations')
          AND (p.qual ~ '\\w+\\s*\\(' OR p.with_check ~ '\\w+\\s*\\(');
    `
  },
  {
    name: "Relevant Functions",
    query: `
      SELECT 
          n.nspname as schema_name,
          p.proname as function_name,
          pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname IN ('public', 'storage')
          AND p.proname IN ('is_admin', 'auth', 'uid', 'current_user_id')
      ORDER BY n.nspname, p.proname;
    `
  },
  {
    name: "Policy Dependencies on Profiles",
    query: `
      SELECT 
          p.policyname,
          p.tablename,
          'References profiles table' as issue_type,
          p.qual as using_clause,
          p.with_check as check_clause
      FROM pg_policies p
      WHERE (p.qual ~ 'profiles' OR p.with_check ~ 'profiles')
          AND p.schemaname = 'public'
      ORDER BY p.tablename, p.policyname;
    `
  },
  {
    name: "Admin Status Check",
    query: `
      SELECT 
          auth.uid() as current_user_id,
          EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) as is_admin,
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) as has_profile;
    `
  }
];

async function runIntrospection() {
  console.log('=== RLS Recursion Introspection ===\n');

  try {
    // First, test basic connection
    console.log('Testing basic connection...');
    const { data: testData, error: testError } = await supabase.rpc('auth', { uid: {} });
    if (testError) {
      console.log('Auth test error:', testError.message);
    } else {
      console.log('Auth connection successful');
    }

    // Run each introspection query
    for (const queryObj of introspectionQueries) {
      console.log(`\n--- ${queryObj.name} ---`);
      
      try {
        const { data, error } = await supabase.rpc('query', { 
          sql: queryObj.query.replace(/\s+/g, ' ').trim() 
        });
        
        if (error) {
          console.log('Error:', error.message);
          continue;
        }
        
        if (data && data.length > 0) {
          console.log('Results:');
          data.forEach((row, index) => {
            console.log(`${index + 1}.`, JSON.stringify(row, null, 2));
          });
        } else {
          console.log('No results found');
        }
        
      } catch (queryError) {
        console.log('Query error:', queryError.message);
      }
    }

    // Test the specific recursion scenario
    console.log('\n--- Testing Recursion Scenario ---');
    console.log('Testing messages table access...');
    
    try {
      const { count, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (msgError) {
        console.log('Messages access error:', msgError.message);
        if (msgError.message.includes('infinite recursion')) {
          console.log('🔴 CONFIRMED: Infinite recursion detected in messages policies');
        }
      } else {
        console.log('✅ Messages table accessible (no immediate recursion)');
      }
    } catch (e) {
      console.log('Messages test error:', e.message);
    }

    // Test storage objects
    console.log('\nTesting storage.objects access...');
    try {
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('verification-temp')
        .list('', { limit: 1 });
      
      if (storageError) {
        console.log('Storage access error:', storageError.message);
        if (storageError.message.includes('infinite recursion')) {
          console.log('🔴 CONFIRMED: Infinite recursion detected in storage policies');
        }
      } else {
        console.log('✅ Storage objects accessible');
      }
    } catch (e) {
      console.log('Storage test error:', e.message);
    }

  } catch (error) {
    console.error('Introspection failed:', error.message);
  }
}

// Alternative approach: Use raw SQL queries
async function runRawIntrospection() {
  console.log('\n=== Raw SQL Introspection ===\n');
  
  // Create a simple test file to trigger the recursion
  const testFile = new Blob(['test'], { type: 'text/plain' });
  
  try {
    console.log('Testing upload to trigger recursion check...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-temp')
      .upload('test-recursion.txt', testFile);
    
    if (uploadError) {
      console.log('Upload error:', uploadError.message);
      if (uploadError.message.includes('infinite recursion')) {
        console.log('🔴 Recursion detected during upload');
      }
    } else {
      console.log('✅ Upload successful');
      
      // Try to list files (this triggers the recursion)
      console.log('Testing file list (potential recursion trigger)...');
      const { data: listData, error: listError } = await supabase.storage
        .from('verification-temp')
        .list('', { limit: 5 });
      
      if (listError) {
        console.log('List error:', listError.message);
        if (listError.message.includes('infinite recursion')) {
          console.log('🔴 CONFIRMED: Recursion in messages policies triggered by storage.list()');
        }
      } else {
        console.log('✅ File list successful');
      }
      
      // Clean up test file
      await supabase.storage
        .from('verification-temp')
        .remove(['test-recursion.txt']);
    }
    
  } catch (error) {
    console.error('Raw introspection failed:', error.message);
  }
}

// Run the introspection
runIntrospection().then(() => {
  return runRawIntrospection();
}).then(() => {
  console.log('\n=== Introspection Complete ===');
  console.log('Check the output above for recursion indicators and policy details.');
  process.exit(0);
}).catch((error) => {
  console.error('Introspection error:', error);
  process.exit(1);
});