require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTrigger() {
  try {
    console.log('Testing the fixed trigger function...');
    
    // Create a test user directly in auth.users to trigger the function
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    
    console.log(`Creating test user: ${testEmail}`);
    
    // Use Supabase Auth Admin to create user (this should trigger our function)
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        phone_number: '+267 12345678'
      }
    });
    
    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }
    
    console.log('User created successfully:', user.user.id);
    
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile created:', profile);
    }
    
    // Check if welcome email was logged
    const { data: emailLog, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (emailError) {
      console.error('Error fetching email log:', emailError);
    } else if (emailLog && emailLog.length > 0) {
      console.log('Welcome email logged:', emailLog[0]);
      console.log('✅ Trigger is working! Email provider:', emailLog[0].provider);
    } else {
      console.log('❌ No welcome email found in logs');
    }
    
    // Clean up - delete the test user
    await supabase.auth.admin.deleteUser(user.user.id);
    console.log('Test user cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTrigger();