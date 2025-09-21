require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthTriggers() {
  console.log('🔍 Checking auth.users table triggers...');
  
  try {
    // Check for triggers on auth.users table
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            t.trigger_name,
            t.event_manipulation,
            t.action_timing,
            t.action_statement,
            t.trigger_schema,
            t.event_object_table
          FROM information_schema.triggers t
          WHERE t.event_object_schema = 'auth' 
            AND t.event_object_table = 'users'
          ORDER BY t.trigger_name;
        `
      });
    
    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError.message);
      
      // Try alternative approach - direct query
      console.log('\n🔄 Trying alternative query method...');
      
      // Check if handle_new_user function exists
      const { data: functions, error: funcError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              p.proname as function_name,
              p.prosrc as source_code
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
              AND p.proname = 'handle_new_user';
          `
        });
      
      if (funcError) {
        console.error('❌ Error checking function:', funcError.message);
      } else {
        console.log('✅ Function check result:', functions);
      }
      
    } else {
      console.log('✅ Triggers found:', triggers);
    }
    
    // Also check what functions exist in public schema
    console.log('\n🔍 Checking public schema functions...');
    const { data: publicFunctions, error: publicError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments,
            p.prorettype::regtype as return_type
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
            AND p.proname LIKE '%user%'
          ORDER BY p.proname;
        `
      });
    
    if (publicError) {
      console.error('❌ Error checking public functions:', publicError.message);
    } else {
      console.log('✅ Public functions with "user" in name:', publicFunctions);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    
    // Final fallback - try to call the function directly
    console.log('\n🔄 Testing function call directly...');
    try {
      const { data: testResult, error: testError } = await supabase
        .rpc('handle_new_user');
      
      if (testError) {
        console.error('❌ Function call failed:', testError.message);
      } else {
        console.log('✅ Function call succeeded:', testResult);
      }
    } catch (callError) {
      console.error('❌ Function call exception:', callError.message);
    }
  }
}

checkAuthTriggers();