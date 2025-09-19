require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkFunctions() {
  console.log('Checking available functions...');
  
  // Check functions using raw SQL
  const { data: functions, error: funcError } = await supabase
    .rpc('exec', {
      sql: `
        SELECT 
          proname as function_name,
          nspname as schema_name,
          pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE nspname IN ('public', 'auth')
        AND proname LIKE '%handle%' OR proname LIKE '%welcome%' OR proname LIKE '%email%'
        ORDER BY nspname, proname;
      `
    });
    
  console.log('Functions result:', { functions, funcError });
  
  // Check triggers
  const { data: triggers, error: trigError } = await supabase
    .rpc('exec', {
      sql: `
        SELECT 
          t.tgname as trigger_name,
          c.relname as table_name,
          n.nspname as schema_name,
          p.proname as function_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE n.nspname IN ('public', 'auth')
        AND (t.tgname LIKE '%welcome%' OR t.tgname LIKE '%user%' OR p.proname LIKE '%handle%')
        ORDER BY n.nspname, c.relname, t.tgname;
      `
    });
    
  console.log('Triggers result:', { triggers, trigError });
}

checkFunctions().catch(console.error);