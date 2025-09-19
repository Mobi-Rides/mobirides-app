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

async function testTriggerCorrected() {
  console.log('🧪 Testing trigger with corrected enum values...');
  
  const testEmail = `trigger-test-${Date.now()}@example.com`;
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Create user
    console.log('\n1️⃣ Creating test user...');
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (userError) {
      console.error('❌ Failed to create user:', userError.message);
      return;
    }
    
    console.log('✅ User created successfully:', user.user.id);
    
    // Wait for trigger
    console.log('\n2️⃣ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check profile
    console.log('\n3️⃣ Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile created successfully!');
      console.log('   - ID:', profile.id);
      console.log('   - Role:', profile.role);
      console.log('   - Full Name:', profile.full_name);
      console.log('   - Phone:', profile.phone_number);
      console.log('   - Created:', profile.created_at);
    }
    
    // Check email log
    console.log('\n4️⃣ Checking welcome email log...');
    const { data: emailLog, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail)
      .eq('subject', 'Welcome to MobiRides!')
      .single();
    
    if (emailError) {
      console.error('❌ Welcome email log not found:', emailError.message);
    } else {
      console.log('✅ Welcome email logged successfully!');
      console.log('   - Message ID:', emailLog.message_id);
      console.log('   - Provider:', emailLog.provider);
      console.log('   - Status:', emailLog.status);
      console.log('   - Sent at:', emailLog.sent_at);
    }
    
    // Check recent logs
    console.log('\n5️⃣ Recent email logs (last 3):');
    const { data: recentLogs, error: recentError } = await supabase
      .from('email_delivery_logs')
      .select('recipient_email, subject, provider, status')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recentError) {
      console.error('❌ Error fetching recent logs:', recentError.message);
    } else {
      recentLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.recipient_email} - ${log.subject} (${log.provider}) - ${log.status}`);
      });
    }
    
    // Cleanup
    console.log('\n6️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted successfully');
    }
    
    console.log('\n🏁 Test completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testTriggerCorrected();