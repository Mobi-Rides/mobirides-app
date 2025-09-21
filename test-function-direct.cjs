require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFunctionDirect() {
  console.log('🧪 Testing handle_new_user function directly...');
  
  try {
    // First create a test user manually
    const testEmail = `direct-test-${Date.now()}@example.com`;
    console.log(`📧 Creating user: ${testEmail}`);
    
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (userError) {
      console.error('❌ Failed to create user:', userError.message);
      return;
    }
    
    console.log('✅ User created:', user.user.id);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if profile was created by trigger
    console.log('\n🔍 Checking if trigger created profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ No profile found via trigger:', profileError.message);
      
      // Try calling the function manually with the user ID
      console.log('\n🔧 Calling handle_new_user function manually...');
      
      // Insert into profiles manually to test the function logic
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: user.user.id,
          role: 'customer',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError.message);
      } else {
        console.log('✅ Manual profile created:', manualProfile);
      }
      
      // Test email sending by calling a simple function
      console.log('\n📧 Testing email functionality...');
      
      // Try to send email manually using our Resend setup
      const emailTest = `
        const { Resend } = require('resend');
        const resend = new Resend('${process.env.RESEND_API_KEY}');
        
        resend.emails.send({
          from: '${process.env.FROM_EMAIL}',
          to: '${testEmail}',
          subject: 'Test Email',
          html: '<p>This is a test email</p>'
        }).then(result => {
          console.log('Email sent:', result);
        }).catch(error => {
          console.error('Email failed:', error);
        });
      `;
      
      console.log('📝 Email test code (run separately):', emailTest);
      
    } else {
      console.log('✅ Profile found via trigger:', profile);
    }
    
    // Check email logs
    console.log('\n📧 Checking email logs...');
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail)
      .order('created_at', { ascending: false });
    
    if (emailError) {
      console.error('❌ Error checking email logs:', emailError.message);
    } else if (emailLogs.length === 0) {
      console.log('❌ No email logs found');
    } else {
      console.log('✅ Email logs found:', emailLogs);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.admin.deleteUser(user.user.id);
    console.log('✅ Test user deleted');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testFunctionDirect();