require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunctionAndTrigger() {
  try {
    // Check if function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('sql', {
        query: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';"
      });
    
    console.log('Function check result:', { functions, funcError });
    
    // Check if trigger exists
    const { data: triggers, error: trigError } = await supabase
      .rpc('sql', {
        query: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';"
      });
    
    console.log('Trigger check result:', { triggers, trigError });
    
    // Check auth.users table structure
    const { data: authUsers, error: authError } = await supabase
      .rpc('sql', {
        query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' LIMIT 5;"
      });
    
    console.log('Auth users table check:', { authUsers, authError });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFunctionAndTrigger();