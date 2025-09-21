require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role to bypass rate limits and email confirmation
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSignupDirect() {
  try {
    const randomEmail = 'test' + Date.now() + '@example.com';
    console.log('Testing signup with service role for:', randomEmail);
    
    // Create user directly using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: randomEmail,
      password: 'testpass123',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: 'Test User ' + Date.now(),
        phone_number: '+26771234567'
      }
    });
    
    console.log('User creation result:', { data: data?.user?.id, error });
    
    if (data?.user) {
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      console.log('Profile check:', { profile, profileError });
      
      // Check if email log was created
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_delivery_logs')
        .select('*')
        .eq('recipient_email', randomEmail);
      
      console.log('Email logs check:', { emailLogs, emailError });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSignupDirect();