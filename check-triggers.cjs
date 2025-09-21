require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggers() {
  try {
    // Check for triggers on auth.users table
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            t.tgname as trigger_name,
            t.tgenabled as enabled,
            p.proname as function_name,
            c.relname as table_name,
            n.nspname as schema_name
          FROM pg_trigger t
          JOIN pg_proc p ON t.tgfoid = p.oid
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE c.relname = 'users' AND n.nspname = 'auth'
          ORDER BY t.tgname;
        `
      });

    if (triggerError) {
      console.error('Error checking triggers:', triggerError);
      return;
    }

    console.log('Auth.users triggers:');
    console.log(JSON.stringify(triggers, null, 2));

    // Also check if handle_new_user function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            p.proname as function_name,
            p.pronargs as arg_count,
            pg_get_function_result(p.oid) as return_type,
            pg_get_function_arguments(p.oid) as arguments
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE p.proname = 'handle_new_user' AND n.nspname = 'public';
        `
      });

    if (funcError) {
      console.error('Error checking functions:', funcError);
      return;
    }

    console.log('\nhandle_new_user functions:');
    console.log(JSON.stringify(functions, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTriggers();