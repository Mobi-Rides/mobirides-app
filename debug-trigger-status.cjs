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

async function debugTriggerStatus() {
  console.log('🔍 Debugging trigger status...');
  
  try {
    // Check if trigger exists
    console.log('\n1️⃣ Checking if trigger exists...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement,
            trigger_schema,
            event_object_table
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND trigger_schema = 'auth';
        `
      });
    
    if (triggerError) {
      console.log('❌ Cannot check triggers (RPC not available):', triggerError.message);
      
      // Alternative: Check function exists
      console.log('\n2️⃣ Checking if function exists...');
      const { data: functions, error: funcError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              routine_name,
              routine_type,
              routine_definition
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'handle_new_user';
          `
        });
      
      if (funcError) {
        console.log('❌ Cannot check functions:', funcError.message);
      } else {
        console.log('✅ Functions found:', functions);
      }
    } else {
      console.log('✅ Triggers found:', triggers);
    }
    
    // Try to call function directly
    console.log('\n3️⃣ Testing function directly...');
    const testUserId = '12345678-1234-1234-1234-123456789012';
    const testEmail = 'direct-test@example.com';
    
    try {
      // First insert a test user record manually
      const { data: insertResult, error: insertError } = await supabase
        .rpc('sql', {
          query: `
            INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
            VALUES ('${testUserId}', '${testEmail}', NOW(), NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
          `
        });
      
      if (insertError) {
        console.log('❌ Cannot insert test user:', insertError.message);
      } else {
        console.log('✅ Test user inserted');
        
        // Now try to call the function
        const { data: funcResult, error: funcCallError } = await supabase
          .rpc('handle_new_user');
        
        if (funcCallError) {
          console.log('❌ Function call failed:', funcCallError.message);
        } else {
          console.log('✅ Function called successfully:', funcResult);
        }
        
        // Clean up test user
        await supabase.rpc('sql', {
          query: `DELETE FROM auth.users WHERE id = '${testUserId}';`
        });
      }
    } catch (directError) {
      console.log('❌ Direct function test failed:', directError.message);
    }
    
    // Check recent profiles
    console.log('\n4️⃣ Checking recent profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log('📋 Recent profiles:');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.id} - ${profile.role} - ${profile.full_name} (${profile.created_at})`);
      });
    }
    
    // Check if there are any duplicate profiles
    console.log('\n5️⃣ Checking for duplicate profiles...');
    const { data: duplicates, error: dupError } = await supabase
      .rpc('sql', {
        query: `
          SELECT id, COUNT(*) as count 
          FROM public.profiles 
          GROUP BY id 
          HAVING COUNT(*) > 1;
        `
      });
    
    if (dupError) {
      console.log('❌ Cannot check duplicates:', dupError.message);
    } else if (duplicates && duplicates.length > 0) {
      console.log('⚠️ Found duplicate profiles:', duplicates);
    } else {
      console.log('✅ No duplicate profiles found');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

debugTriggerStatus();