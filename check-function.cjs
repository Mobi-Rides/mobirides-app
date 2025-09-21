require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFunction() {
  try {
    // Use raw SQL to check the function
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          p.proname as function_name,
          p.prosrc as source_code,
          pg_get_function_arguments(p.oid) as arguments,
          pg_get_function_result(p.oid) as return_type
        FROM pg_catalog.pg_proc p 
        JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_new_user' AND n.nspname = 'public'
      `
    });
    
    if (error) {
      console.error('Error fetching function:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Current handle_new_user function details:');
      console.log('Arguments:', data[0].arguments);
      console.log('Return type:', data[0].return_type);
      console.log('\nSource code:');
      console.log(data[0].source_code);
    } else {
      console.log('No handle_new_user function found');
    }
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkFunction();