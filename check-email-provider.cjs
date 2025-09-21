require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmailProvider() {
  try {
    console.log('Checking recent email logs to understand the current email provider setup...');
    
    const { data: logs, error } = await supabase
      .from('email_delivery_logs')
      .select('provider, status, error_message, created_at, subject, recipient_email')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching logs:', error.message);
      return;
    }
    
    console.log('\nRecent email logs:');
    console.log('==================');
    
    if (logs && logs.length > 0) {
      logs.forEach((log, i) => {
        console.log(`${i + 1}. Provider: ${log.provider}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Subject: ${log.subject}`);
        console.log(`   Recipient: ${log.recipient_email}`);
        console.log(`   Date: ${log.created_at}`);
        if (log.error_message) {
          console.log(`   Error: ${log.error_message}`);
        }
        console.log('   ---');
      });
      
      // Analyze provider usage
      const providerCounts = {};
      logs.forEach(log => {
        providerCounts[log.provider] = (providerCounts[log.provider] || 0) + 1;
      });
      
      console.log('\nProvider Usage Summary:');
      Object.entries(providerCounts).forEach(([provider, count]) => {
        console.log(`- ${provider}: ${count} emails`);
      });
      
      // Check if any recent emails used Resend
      const resendEmails = logs.filter(log => log.provider === 'resend');
      const sendgridEmails = logs.filter(log => log.provider === 'sendgrid');
      
      console.log('\nAnalysis:');
      if (resendEmails.length > 0) {
        console.log('✅ Some emails are using Resend provider');
      } else {
        console.log('❌ No emails found using Resend provider');
      }
      
      if (sendgridEmails.length > 0) {
        console.log('⚠️  Some emails are still using SendGrid provider');
      }
      
    } else {
      console.log('No email logs found');
    }
    
  } catch (error) {
    console.error('Failed to check email provider:', error.message);
  }
}

checkEmailProvider();