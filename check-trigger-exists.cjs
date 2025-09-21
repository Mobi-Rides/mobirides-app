require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role to check system tables
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkTriggerExists() {
  try {
    console.log('Checking if trigger and function exist...');
    
    // Check if the function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('sql', {
        query: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname = 'handle_new_user' 
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `
      });
    
    console.log('Function check:', { functions, funcError });
    
    // Check if the trigger exists
    const { data: triggers, error: trigError } = await supabase
      .rpc('sql', {
        query: `
          SELECT tgname, tgenabled, tgrelid::regclass as table_name
          FROM pg_trigger 
          WHERE tgname = 'on_auth_user_created';
        `
      });
    
    console.log('Trigger check:', { triggers, trigError });
    
    // Alternative: Check using information_schema
    const { data: triggerInfo, error: trigInfoError } = await supabase
      .rpc('sql', {
        query: `
          SELECT trigger_name, event_manipulation, event_object_table, action_statement
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created';
        `
      });
    
    console.log('Trigger info schema check:', { triggerInfo, trigInfoError });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTriggerExists();