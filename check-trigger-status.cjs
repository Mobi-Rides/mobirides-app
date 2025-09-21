require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggerStatus() {
  try {
    console.log('Checking trigger and function status...');
    
    // Check if the function exists and get its definition
    const { data: functions, error: funcError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          p.proname as function_name,
          p.prosrc as source_code,
          pg_get_function_arguments(p.oid) as arguments,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'handle_new_user'
        ORDER BY p.oid DESC;
      `
    });
    
    if (funcError) {
      console.error('Error checking function:', funcError);
    } else {
      console.log('Functions found:', functions?.length || 0);
      if (functions && functions.length > 0) {
        functions.forEach((func, index) => {
          console.log(`\nFunction ${index + 1}:`);
          console.log('Name:', func.function_name);
          console.log('Arguments:', func.arguments);
          console.log('Return type:', func.return_type);
          console.log('Source contains "resend":', func.source_code.includes('resend'));
          console.log('Source contains "sendgrid":', func.source_code.includes('sendgrid'));
        });
      }
    }
    
    // Check triggers on auth.users
    const { data: triggers, error: trigError } = await supabase.rpc('sql', {
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
    
    if (trigError) {
      console.error('Error checking triggers:', trigError);
    } else {
      console.log('\nTriggers on auth.users:', triggers?.length || 0);
      if (triggers && triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log('\nTrigger:', trigger.trigger_name);
          console.log('Event:', trigger.event_manipulation);
          console.log('Timing:', trigger.action_timing);
          console.log('Action:', trigger.action_statement);
        });
      }
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  }
}

checkTriggerStatus();