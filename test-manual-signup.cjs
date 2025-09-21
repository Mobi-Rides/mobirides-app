require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testManualSignup() {
  try {
    console.log('Testing manual user signup to see if trigger fires...');
    
    const testEmail = `manual-test-${Date.now()}@example.com`;
    console.log(`Creating user: ${testEmail}`);
    
    // Sign up a user using the auth.signUp method (this should trigger the database trigger)
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Manual Test User',
          phone_number: '+267 87654321'
        }
      }
    });
    
    if (error) {
      console.error('Signup error:', error);
      return;
    }
    
    console.log('User signup result:', {
      user_id: data.user?.id,
      email: data.user?.email,
      confirmed: data.user?.email_confirmed_at ? 'YES' : 'NO'
    });
    
    // Wait for trigger to execute
    console.log('Waiting 3 seconds for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (data.user?.id) {
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile not found:', profileError.message);
      } else {
        console.log('✅ Profile created:', {
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role
        });
      }
      
      // Check if welcome email was logged
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_delivery_logs')
        .select('*')
        .eq('recipient_email', testEmail)
        .order('created_at', { ascending: false });
      
      if (emailError) {
        console.log('❌ Error checking email logs:', emailError.message);
      } else if (emailLogs && emailLogs.length > 0) {
        console.log('✅ Welcome email logged:', {
          provider: emailLogs[0].provider,
          status: emailLogs[0].status,
          subject: emailLogs[0].subject,
          sent_at: emailLogs[0].sent_at
        });
        
        if (emailLogs[0].provider === 'resend') {
          console.log('🎉 SUCCESS: Email is using Resend provider!');
        } else {
          console.log('⚠️  WARNING: Email is still using', emailLogs[0].provider, 'provider');
        }
      } else {
        console.log('❌ No welcome email found in logs');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testManualSignup();