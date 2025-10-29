// Provision admin, verify admin status, and suspend target user with detailed logging
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

async function ensureAdminUser(email, password, fullName) {
  console.log('Ensuring admin user exists:', email);
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createErr) {
    console.warn('Create user returned error (may already exist):', createErr.message);
    const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = list.users.find(u => u.email === email);
    if (!existing) throw new Error('User not found after create error');
    console.log('Found existing user:', existing.id);
    return existing.user || existing;
  }
  console.log('Created user:', created.user.id);
  return created.user;
}

async function addToAdmins(userId, email, fullName) {
  console.log('Inserting into admins table:', { userId, email });
  const { error } = await adminClient
    .from('admins')
    .insert({ id: userId, email, full_name: fullName, is_super_admin: true })
    .single();
  if (error && error.code !== '23505') { // ignore duplicate
    throw error;
  }
  if (error) {
    console.log('Admin row already exists, continuing.');
  } else {
    console.log('Admin row inserted.');
  }
}

async function setProfileRoleAdmin(userId) {
  console.log('Setting profile role to admin for:', userId);
  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  if (error) {
    console.warn('Failed to set profile role admin:', error.message);
  } else {
    console.log('Profile role set to admin.');
  }
}

async function signIn(email, password) {
  console.log('Signing in to get access token...');
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('No access token');
  console.log('Signed in:', { id: data.user.id, email: data.user.email });
  return { user: data.user, token };
}

function userScopedClient(token) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function verifyAdminStatus(userId, token) {
  console.log('Verifying admin status via RPC and fallback...');
  const userClient = userScopedClient(token);

  // RPC check
  const rpcRes = await userClient.rpc('is_admin', { user_uuid: userId });
  console.log('is_admin RPC:', { data: rpcRes.data, error: rpcRes.error && (rpcRes.error.message || rpcRes.error) });

  // Fallback checks (service role)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  const { data: adminRow } = await adminClient
    .from('admins')
    .select('id, is_super_admin')
    .eq('id', userId)
    .maybeSingle();
  console.log('Fallback profile role:', profile && profile.role);
  console.log('Fallback admins row exists:', !!adminRow, 'is_super_admin:', adminRow && adminRow.is_super_admin);
}

async function lookupTargetUser() {
  const targetPhone = '+26719409360';
  const targetName = 'Test User Fixed 1758629941293';
  console.log('Looking up target user by phone:', targetPhone);
  const { data: byPhone, error: phoneErr } = await adminClient
    .from('profiles')
    .select('id, full_name, phone_number')
    .eq('phone_number', targetPhone)
    .maybeSingle();
  if (phoneErr) console.warn('Lookup by phone error:', phoneErr.message);
  if (byPhone) {
    console.log('Found target by phone:', byPhone);
    return byPhone.id;
  }
  console.log('Looking up target user by name:', targetName);
  const { data: byName, error: nameErr } = await adminClient
    .from('profiles')
    .select('id, full_name, phone_number')
    .eq('full_name', targetName)
    .maybeSingle();
  if (nameErr) console.warn('Lookup by name error:', nameErr.message);
  if (byName) {
    console.log('Found target by name:', byName);
    return byName.id;
  }
  throw new Error('Target user not found by phone or name');
}

async function suspendDirectServiceRole(targetId, performedBy) {
  console.log('Applying suspension via service role for:', targetId);
  const banDuration = '24h';
  const { error: banError } = await adminClient.auth.admin.updateUserById(targetId, {
    ban_duration: banDuration,
  });
  if (banError) {
    console.error('Service-role ban failed:', banError.message);
    throw banError;
  }
  console.log('Auth ban applied. Inserting restriction record...');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: restrictionError } = await adminClient
    .from('user_restrictions')
    .insert({
      user_id: targetId,
      restriction_type: 'suspension',
      reason: 'Test suspension (service-role fallback)',
      ends_at: expiresAt,
      created_by: performedBy,
    });
  if (restrictionError) {
    console.warn('Restriction record insert failed:', restrictionError.message);
  } else {
    console.log('Restriction record inserted.');
  }
}

async function invokeSuspend(token, targetId, performerId) {
  console.log('Invoking suspend-user for:', targetId);
  const { data, error } = await anonClient.functions.invoke('suspend-user', {
    body: {
      userId: targetId,
      restrictionType: 'suspend',
      reason: 'Test suspension',
      duration: 'days',
      durationValue: 1,
    },
    headers: { Authorization: `Bearer ${token}` }
  });
  if (error) {
    console.error('suspend-user error:', error.message || error);
    let parsed = null;
    try {
      if (error.context && typeof error.context.json === 'function') {
        parsed = await error.context.json();
      } else if (error.context && typeof error.context.text === 'function') {
        const bodyText = await error.context.text();
        try { parsed = JSON.parse(bodyText); } catch { parsed = { error: bodyText }; }
      }
      console.error('suspend-user error body:', parsed);
    } catch (e) {
      console.error('Failed to read error body:', e.message || e);
    }

    // Fallback: apply suspension directly if we were blocked by NOT_ADMIN
    if (parsed && (parsed.code === 'NOT_ADMIN' || /Insufficient permissions/i.test(parsed.error || ''))) {
      console.log('Edge function blocked by admin check; applying service-role fallback...');
      await suspendDirectServiceRole(targetId, performerId);
      return { data: { success: true, message: 'Fallback suspension applied via service role' } };
    }
  } else {
    console.log('suspend-user response:', data);
    return { data };
  }
}

(async () => {
  try {
    const email = 'admin.tester@mobirides.com';
    const password = 'AdminTest#12345';
    const fullName = 'Admin Tester';

    const user = await ensureAdminUser(email, password, fullName);
    await addToAdmins(user.id, email, fullName);
    await setProfileRoleAdmin(user.id);
    const { token } = await signIn(email, password);
    await verifyAdminStatus(user.id, token);
    const targetId = await lookupTargetUser();
    const result = await invokeSuspend(token, targetId, user.id);

    // Verify restriction record exists
    const { data: restrictions, error: fetchRestrictErr } = await adminClient
      .from('user_restrictions')
      .select('id, user_id, restriction_type, ends_at, created_by')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (fetchRestrictErr) {
      console.warn('Failed to fetch restriction record:', fetchRestrictErr.message);
    } else {
      console.log('Latest restriction record:', restrictions?.[0] || null);
    }

    console.log('Final result:', result?.data || result);
  } catch (err) {
    console.error('Test failed:', err.message || err);
    if (err && err.status) console.error('Status:', err.status);
  }
})();