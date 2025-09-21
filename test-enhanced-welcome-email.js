import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedWelcomeEmail() {
  console.log('🧪 Testing Enhanced Welcome Email System...');
  
  try {
    // Test the resend-service edge function directly with rich template
    console.log('\n📧 Testing rich welcome email template...');
    
    const testEmailData = {
      to: 'test.enhanced@example.com',
      templateId: 'welcome-renter',
      dynamicData: {
        user_name: 'John Doe',
        first_name: 'John',
        email: 'test.enhanced@example.com',
        browse_cars_url: 'https://mobirides.com/cars',
        profile_url: 'https://mobirides.com/profile',
        community_url: 'https://mobirides.com/community',
        app_url: 'https://mobirides.com',
        support_email: 'support@mobirides.com',
        help_center_url: 'https://mobirides.com/help'
      }
    };
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke('resend-service', {
      body: testEmailData
    });
    
    if (emailError) {
      console.error('❌ Email service error:', emailError);
    } else {
      console.log('✅ Enhanced welcome email sent successfully!');
      console.log('📊 Response:', emailResponse);
    }
    
    // Check email delivery logs
    console.log('\n📋 Checking email delivery logs...');
    const { data: logs, error: logsError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', 'test.enhanced@example.com')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('❌ Error fetching logs:', logsError);
    } else {
      console.log(`📊 Found ${logs.length} email log entries:`);
      logs.forEach(log => {
        console.log(`  - ${log.email_type}: ${log.status} (${log.created_at})`);
        if (log.error_message) {
          console.log(`    Error: ${log.error_message}`);
        }
      });
    }
    
    // Test host welcome email template
    console.log('\n🏆 Testing host welcome email template...');
    
    const hostEmailData = {
      to: 'test.host@example.com',
      templateId: 'welcome-host',
      dynamicData: {
        user_name: 'Jane Smith',
        first_name: 'Jane',
        email: 'test.host@example.com',
        app_url: 'https://mobirides.com',
        support_email: 'support@mobirides.com'
      }
    };
    
    const { data: hostEmailResponse, error: hostEmailError } = await supabase.functions.invoke('resend-service', {
      body: hostEmailData
    });
    
    if (hostEmailError) {
      console.error('❌ Host email service error:', hostEmailError);
    } else {
      console.log('✅ Enhanced host welcome email sent successfully!');
      console.log('📊 Response:', hostEmailResponse);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedWelcomeEmail().then(() => {
  console.log('\n🎉 Enhanced welcome email test completed!');
}).catch(console.error);