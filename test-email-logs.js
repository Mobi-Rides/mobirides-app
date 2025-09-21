import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmailLogs() {
  try {
    console.log('Checking email delivery logs for test users...');
    
    const { data, error } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .in('recipient_email', ['test.welcome@example.com', 'trigger.test@example.com'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error querying email logs:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Welcome email logs found:');
      data.forEach((log, index) => {
        console.log(`${index + 1}. Email Type: ${log.email_type}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Sent At: ${log.sent_at}`);
        console.log(`   Provider: ${log.provider}`);
        console.log(`   Subject: ${log.subject}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No welcome email logs found for test users');
      console.log('This might indicate the trigger is not working properly.');
    }

    // Also check recent logs in general
    console.log('\nChecking recent email logs (last 10):');
    const { data: recentLogs, error: recentError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Error querying recent logs:', recentError);
    } else if (recentLogs && recentLogs.length > 0) {
      console.log('Recent email logs:');
      recentLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.recipient_email} - ${log.email_type} - ${log.status} - ${log.created_at}`);
      });
    } else {
      console.log('No recent email logs found.');
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkEmailLogs();