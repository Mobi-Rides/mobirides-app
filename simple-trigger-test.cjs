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

async function simpleTriggerTest() {
  console.log('🧪 Simple trigger test...');
  
  const testEmail = `simple-test-${Date.now()}@example.com`;
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Get profile count before
    const { count: beforeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles before: ${beforeCount}`);
    
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
    
    // Wait longer for trigger
    console.log('\n2️⃣ Waiting for trigger (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get profile count after
    const { count: afterCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Profiles after: ${afterCount}`);
    
    if (afterCount > beforeCount) {
      console.log('✅ Profile count increased! Trigger is working.');
      
      // Try to find the specific profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id);
      
      if (profileError) {
        console.error('❌ Error querying profile:', profileError.message);
      } else if (profiles.length === 0) {
        console.log('⚠️ No profile found for this user ID');
      } else if (profiles.length > 1) {
        console.log(`⚠️ Multiple profiles found (${profiles.length}):`);
        profiles.forEach((p, i) => {
          console.log(`   ${i + 1}. ID: ${p.id}, Role: ${p.role}, Name: ${p.full_name}`);
        });
      } else {
        console.log('✅ Profile found:');
        console.log('   - ID:', profiles[0].id);
        console.log('   - Role:', profiles[0].role);
        console.log('   - Full Name:', profiles[0].full_name);
        console.log('   - Phone:', profiles[0].phone_number);
      }
    } else {
      console.log('❌ Profile count did not increase. Trigger not working.');
    }
    
    // Check email logs
    console.log('\n3️⃣ Checking email logs...');
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('recipient_email', testEmail);
    
    if (emailError) {
      console.error('❌ Error querying email logs:', emailError.message);
    } else if (emailLogs.length === 0) {
      console.log('❌ No email logs found for this user');
    } else {
      console.log(`✅ Found ${emailLogs.length} email log(s):`);
      emailLogs.forEach((log, i) => {
        console.log(`   ${i + 1}. ${log.subject} (${log.provider}) - ${log.status}`);
      });
    }
    
    // Cleanup
    console.log('\n4️⃣ Cleaning up...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

simpleTriggerTest();