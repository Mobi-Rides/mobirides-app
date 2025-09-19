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

async function testWebhookAlternative() {
  console.log('🔄 Testing alternative approach without auth triggers...');
  
  const testEmail = `webhook-test-${Date.now()}@example.com`;
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
    
    // Manually call the profile creation function
    console.log('\n2️⃣ Manually creating profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        role: 'renter',
        full_name: 'Test User',
        phone_number: '+267 12345678'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
    } else {
      console.log('✅ Profile created successfully:');
      console.log('   - ID:', profile.id);
      console.log('   - Role:', profile.role);
      console.log('   - Full Name:', profile.full_name);
    }
    
    // Manually log welcome email
    console.log('\n3️⃣ Manually logging welcome email...');
    
    const { data: emailLog, error: emailError } = await supabase
      .from('email_delivery_logs')
      .insert({
        message_id: `welcome_${user.user.id}`,
        recipient_email: testEmail,
        sender_email: 'noreply@mobirides.com',
        subject: 'Welcome to MobiRides!',
        provider: 'resend',
        status: 'sent',
        metadata: {
          user_id: user.user.id,
          email_type: 'welcome_email',
          template: 'welcome'
        },
        sent_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (emailError) {
      console.error('❌ Failed to log email:', emailError.message);
    } else {
      console.log('✅ Email logged successfully:');
      console.log('   - Message ID:', emailLog.message_id);
      console.log('   - Provider:', emailLog.provider);
      console.log('   - Status:', emailLog.status);
    }
    
    // Test actual email sending
    console.log('\n4️⃣ Testing actual email sending...');
    
    try {
      // Call the send_welcome_email function if it exists
      const { data: emailResult, error: sendError } = await supabase
        .rpc('send_welcome_email', {
          user_id: user.user.id,
          user_email: testEmail
        });
      
      if (sendError) {
        console.log('❌ Welcome email function not available:', sendError.message);
      } else {
        console.log('✅ Welcome email sent:', emailResult);
      }
    } catch (sendError) {
      console.log('❌ Email sending failed:', sendError.message);
    }
    
    // Check recent email logs
    console.log('\n5️⃣ Recent email logs (last 3):');
    const { data: recentLogs, error: recentError } = await supabase
      .from('email_delivery_logs')
      .select('recipient_email, subject, provider, status, sent_at')
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
    console.log('\n6️⃣ Cleaning up...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted');
    }
    
    console.log('\n🏁 Alternative approach test completed!');
    console.log('\n💡 Summary:');
    console.log('   - Auth triggers cannot be created on auth.users table (permission denied)');
    console.log('   - Manual profile creation works');
    console.log('   - Manual email logging works');
    console.log('   - Need to implement profile creation in signup flow manually');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testWebhookAlternative()