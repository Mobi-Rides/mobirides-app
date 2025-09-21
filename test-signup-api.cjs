require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSignupAPI() {
  console.log('🧪 Testing Signup API...');
  
  const testEmail = `signup-test-${Date.now()}@example.com`;
  console.log('📧 Test email:', testEmail);
  
  try {
    // Get profile count before
    const { count: profilesBefore } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Profiles before:', profilesBefore);
    
    console.log('\n1️⃣ Testing signup API...');
    
    // Test the signup API endpoint
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpassword123',
        fullName: 'Test User',
        phoneNumber: '+26771234567'
      })
    });
    
    const result = await response.json();
    console.log('📝 Signup response:', result);
    
    if (!result.success) {
      console.log('❌ Signup failed:', result.error);
      return;
    }
    
    const userId = result.user.id;
    console.log('✅ User created via API:', userId);
    
    console.log('\n2️⃣ Waiting for processing (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check profile count after
    const { count: profilesAfter } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Profiles after:', profilesAfter);
    
    if (profilesAfter > profilesBefore) {
      console.log('✅ Profile created successfully!');
    } else {
      console.log('❌ Profile was not created.');
    }
    
    console.log('\n3️⃣ Checking for profile...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
      console.log('✅ Profile found:', {
        id: profile.id,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        role: profile.role
      });
    } else {
      console.log('❌ Profile not found');
    }
    
    console.log('\n4️⃣ Checking email logs...');
    const { data: emailLogs } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail)
      .order('created_at', { ascending: false });
    
    if (emailLogs && emailLogs.length > 0) {
      console.log('✅ Email log found:', {
        subject: emailLogs[0].subject,
        status: emailLogs[0].status,
        sent_at: emailLogs[0].sent_at
      });
    } else {
      console.log('❌ No email logs found');
    }
    
    console.log('\n5️⃣ Cleaning up...');
    // Delete the test user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
    } else {
      console.log('✅ Test user deleted');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSignupAPI();