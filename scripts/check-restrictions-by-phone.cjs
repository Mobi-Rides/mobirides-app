// Check restrictions by phone number using both service role and admin user token
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk1NDkxNCwiZXhwIjoyMDUwNTMwOTE0fQ.iArZaXCWG2_LQi3ZPUbUl8GZURucpATlyUtuhOjiAWk';

const adminEmail = 'admin.tester@mobirides.com';
const adminPassword = 'AdminTest#12345';

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

function userScopedClient(token) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function main() {
  const phone = process.argv[2] || '+26779372156';
  console.log('Checking restrictions for phone:', phone);

  const { data: profile, error: pErr } = await adminClient
    .from('profiles')
    .select('id, full_name, phone_number, role, created_at')
    .eq('phone_number', phone)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error('Profile not found for phone');
  console.log('Profile:', profile);

  // Service role read (ground truth)
  const { data: srRestrictions, error: srErr } = await adminClient
    .from('user_restrictions')
    .select('id, active, restriction_type, reason, starts_at, ends_at, created_by, created_at, updated_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });
  if (srErr) {
    console.error('Service role restrictions fetch error:', srErr.message);
  }
  console.log('Service role restrictions count:', srRestrictions?.length || 0);
  console.log('Latest (service role):', (srRestrictions && srRestrictions[0]) || null);

  // Admin user token read (mimics UI)
  const { data: signIn, error: sErr } = await anonClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (sErr) {
    console.error('Admin sign-in error:', sErr.message);
  }
  const accessToken = signIn?.session?.access_token;
  if (!accessToken) {
    console.warn('No admin access token; skipping user-scoped read');
  } else {
    const userClient = userScopedClient(accessToken);
    const { data: uiRestrictions, error: uiErr } = await userClient
      .from('user_restrictions')
      .select('id, active, restriction_type, reason, starts_at, ends_at, created_by, created_at, updated_at')
      .eq('user_id', profile.id)
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (uiErr) {
      console.error('UI restrictions fetch error (RLS?):', uiErr.message);
    }
    console.log('UI-visible active restrictions count:', uiRestrictions?.length || 0);
    console.log('Latest (UI):', (uiRestrictions && uiRestrictions[0]) || null);
  }

  // Check auth ban status
  try {
    const { data: authUser, error: authErr } = await adminClient.auth.admin.getUserById(profile.id);
    if (authErr) {
      console.warn('Auth getUserById error:', authErr.message);
    }
    console.log('Auth user fetched:', !!authUser);
    const u = authUser && (authUser.user || authUser);
    console.log('Auth user keys:', u ? Object.keys(u) : []);
  } catch (e) {
    console.warn('Auth status check failed:', e.message);
  }
}

main().catch((err) => {
  console.error('Check failed:', err && (err.message || err));
  process.exit(1);
});