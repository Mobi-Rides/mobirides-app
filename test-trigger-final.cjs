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

async function testTriggerComplete() {
  const testEmail = `test-trigger-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('🧪 Testing complete trigger functionality...');
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Step 1: Create test user using Admin API
    console.log('\n1️⃣ Creating test user...');
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm to avoid email issues
    });
    
    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      return;
    }
    
    console.log('✅ User created successfully:', user.user.id);
    
    // Step 2: Wait for trigger to execute
    console.log('\n2️⃣ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check if profile was created
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
      console.log('📋 Profile data:', {
        id: profile.id,
        role: profile.role,
        created_at: profile.created_at
      });
    }
    
    // Step 4: Check for welcome email log (by recipient_email)
    console.log('\n4️⃣ Checking welcome email log...');
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail)
      .eq('subject', 'Welcome to MobiRides!')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (emailError) {
      console.error('❌ Error checking email logs:', emailError.message);
    } else if (emailLogs && emailLogs.length > 0) {
      const emailLog = emailLogs[0];
      console.log('✅ Welcome email log found!');
      console.log('📧 Email details:', {
        provider: emailLog.provider,
        status: emailLog.status,
        sent_at: emailLog.sent_at,
        subject: emailLog.subject
      });
      
      if (emailLog.provider === 'resend') {
        console.log('🎉 SUCCESS: Email sent via Resend (correct provider)!');
      } else {
        console.log(`⚠️  WARNING: Email sent via ${emailLog.provider} instead of Resend`);
      }
    } else {
      console.log('❌ No welcome email log found');
    }
    
    // Step 5: Check recent email logs for debugging
    console.log('\n5️⃣ Recent email logs (last 5):');
    const { data: recentLogs, error: recentError } = await supabase
      .from('email_delivery_logs')
      .select('recipient_email, subject, provider, status, sent_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Error fetching recent logs:', recentError.message);
    } else {
      recentLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.recipient_email} - ${log.subject} (${log.provider}) - ${log.status}`);
      });
    }
    
    // Step 6: Cleanup - Delete test user
    console.log('\n6️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted successfully');
    }
    
    console.log('\n🏁 Test completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

testTriggerComplete();