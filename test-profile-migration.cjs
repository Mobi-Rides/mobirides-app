require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProfileCreation() {
  console.log('=== Testing Profile Creation System ===');
  
  try {
    // 1. Test creating a new user to see if the trigger works
    console.log('\n1. Testing new user creation with trigger...');
    const testEmail = `test-profile-${Date.now()}@example.com`;
    const testName = 'Test User Profile';
    const testPhone = '+26771234567';
    
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: testName,
        phone_number: testPhone
      }
    });
    
    if (userError) {
      console.error('Error creating test user:', userError);
      return;
    }
    
    console.log('✅ Test user created:', newUser.user.id);
    
    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if profile was created correctly
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile not found:', profileError);
    } else {
      console.log('✅ Profile created successfully:', {
        id: profileData.id,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        email_confirmed: profileData.email_confirmed
      });
      
      // Verify the data matches
      if (profileData.full_name === testName && profileData.phone_number === testPhone) {
        console.log('✅ Profile data matches expected values');
      } else {
        console.log('❌ Profile data mismatch:');
        console.log('  Expected name:', testName, 'Got:', profileData.full_name);
        console.log('  Expected phone:', testPhone, 'Got:', profileData.phone_number);
      }
    }
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(newUser.user.id);
    console.log('🧹 Test user cleaned up');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

async function runMigration() {
  console.log('\n=== Running Profile Migration ===');
  
  try {
    // Call the migration edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/migrate-user-profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Migration completed successfully');
      console.log('📊 Migration Stats:', result.stats);
    } else {
      console.error('❌ Migration failed:', result.error);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

async function checkExistingProfiles() {
  console.log('\n=== Checking Existing Profiles ===');
  
  try {
    // Get some profiles to check their current state
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, email_confirmed, created_at')
      .limit(5);
      
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles (showing first 5):`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id.substring(0, 8)}...`);
      console.log(`     Name: ${profile.full_name || 'NULL'}`);
      console.log(`     Phone: ${profile.phone_number || 'NULL'}`);
      console.log(`     Email Confirmed: ${profile.email_confirmed}`);
      console.log(`     Created: ${profile.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Check profiles error:', error);
  }
}

async function main() {
  await checkExistingProfiles();
  await testProfileCreation();
  await runMigration();
  await checkExistingProfiles();
}

main().catch(console.error);