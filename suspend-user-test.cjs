// Node test script: sign in, grant admin to self, find target user, and invoke suspend-user
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://putjowciegpzdheideaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Mobirides suspend-user test ===');
  try {
    console.log('Signing in as test@mobirides.com ...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@mobirides.com',
      password: 'testpassword123'
    });
    if (signInError) {
      console.error('Sign-in error:', signInError.message);
      console.error('Sign-in details:', signInError);
      process.exit(1);
    }
    const user = signInData.user;
    const token = signInData.session?.access_token;
    console.log('Signed in user:', { id: user.id, email: user.email });
    if (!token) {
      console.error('No access token returned.');
      process.exit(1);
    }

    // Ensure the signed-in user is an admin by invoking add-admin (verify_jwt=true)
    console.log('Granting admin to signed-in user via add-admin ...');
    const { data: addAdminData, error: addAdminError } = await supabase.functions.invoke('add-admin', {
      body: { userId: user.id, isSuperAdmin: true, userName: user.user_metadata?.full_name || 'Test User' },
      headers: { Authorization: `Bearer ${token}` }
    });
    if (addAdminError) {
      console.error('add-admin error:', addAdminError.message || addAdminError);
      console.error('add-admin details:', addAdminError);
      // Continue anyway, suspend-user has fallback admin check but likely needs admins row
    } else {
      console.log('add-admin response:', addAdminData);
    }

    // Look up target user by phone, fallback to name
    const targetPhone = '+26719409360';
    const targetName = 'Test User Fixed 1758629941293';
    console.log('Looking up target user by phone:', targetPhone);
    const { data: byPhone, error: phoneErr } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', targetPhone)
      .maybeSingle();

    let targetId = null;
    if (phoneErr) {
      console.warn('Lookup by phone error:', phoneErr.message || phoneErr);
    }
    if (byPhone) {
      targetId = byPhone.id;
      console.log('Found target by phone:', byPhone);
    } else {
      console.log('Looking up target user by exact name:', targetName);
      const { data: byName, error: nameErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('full_name', targetName)
        .maybeSingle();
      if (nameErr) {
        console.warn('Lookup by name error:', nameErr.message || nameErr);
      }
      if (byName) {
        targetId = byName.id;
        console.log('Found target by name:', byName);
      }
    }

    if (!targetId) {
      console.error('Target user not found by phone or name.');
      process.exit(1);
    }

    // Invoke suspend-user
    console.log('Invoking suspend-user for target:', targetId);
    const { data: suspendData, error: suspendError } = await supabase.functions.invoke('suspend-user', {
      body: {
        userId: targetId,
        restrictionType: 'suspend',
        reason: 'Test suspension',
        duration: 'days',
        durationValue: 1
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (suspendError) {
      console.error('suspend-user error:', suspendError.message || suspendError);
      console.error('suspend-user details:', suspendError);
      process.exitCode = 2;
    } else {
      console.log('suspend-user response:', suspendData);
    }

  } catch (err) {
    console.error('Unexpected error:', err?.message || err);
    console.error('Error details:', err);
    process.exit(1);
  }
}

main();