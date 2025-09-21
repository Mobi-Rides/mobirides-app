require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthEmailConfig() {
  try {
    console.log('Testing Supabase Auth email configuration...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('From Email configured:', process.env.FROM_EMAIL);
    console.log('Resend API Key configured:', process.env.RESEND_API_KEY ? 'Yes' : 'No');
    
    // Try to get auth settings (this might not work with client, but let's try)
    console.log('\nTesting basic auth functionality...');
    
    // Test if we can access auth admin functions
    const testEmail = `authtest${Date.now()}@example.com`;
    console.log(`\nAttempting to create user with email: ${testEmail}`);
    
    // Use the admin client to create a user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true // Skip email confirmation for this test
    });
    
    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    
    console.log('✅ User created successfully:', user.user.id);
    
    // Check if profile was created by our trigger
    console.log('\nChecking if profile was created by trigger...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile created:', profile);
    }
    
    // Check if welcome email was logged
    console.log('\nChecking if welcome email was logged...');
    const { data: emailLog, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('email_type', 'welcome')
      .single();
    
    if (emailError) {
      console.error('❌ Welcome email log not found:', emailError.message);
    } else {
      console.log('✅ Welcome email logged:', {
        provider: emailLog.provider,
        status: emailLog.status,
        subject: emailLog.subject
      });
    }
    
    // Clean up - delete the test user
    console.log('\nCleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    if (deleteError) {
      console.error('Error deleting test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuthEmailConfig();