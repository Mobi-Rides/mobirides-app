require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmailLogs() {
  console.log('Checking all email logs...');
  
  // Get all email logs
  const { data: allLogs, error: allError, count: totalCount } = await supabase
    .from('email_delivery_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('All email logs:', {
    count: totalCount,
    logs: allLogs,
    error: allError
  });
  
  // Check specifically for welcome emails
  const { data: welcomeLogs, error: welcomeError, count: welcomeCount } = await supabase
    .from('email_delivery_logs')
    .select('*', { count: 'exact' })
    .eq('subject', 'Welcome to MobiRides!');
    
  console.log('Welcome email logs:', {
    count: welcomeCount,
    logs: welcomeLogs,
    error: welcomeError
  });
}

checkEmailLogs().catch(console.error);