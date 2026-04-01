/**
 * Test script for S9-011: user_consents table
 * Run: node --env-file=.env.test --experimental-strip-types scripts/test-s9-011.ts
 */

const URL = 'https://putjowciegpzdheideaf.supabase.co';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';
const SVC_H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

let p = 0, f = 0;
const ok   = (l: string) => { console.log(`  ✅ ${l}`); p++; };
const fail = (l: string, e?: unknown) => { console.log(`  ❌ ${l}`, e ?? ''); f++; };

const rest = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`${URL}${path}`, { headers: SVC_H, ...opts });
  const t = await r.text(); return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
};

console.log('\n── S9-011: user_consents table ──');

// ── Setup: create test user ───────────────────────────────────────────────────
const email = `consent-test-${Date.now()}@mobirides-test.com`;
const created = await (await fetch(`${URL}/auth/v1/admin/users`, {
  method: 'POST', headers: SVC_H,
  body: JSON.stringify({ email, password: 'Test1234!', email_confirm: true })
})).json();
const userId = created?.id;
if (!userId) { fail('Could not create test user', created); process.exit(1); }

// Get user JWT
const signIn = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'Test1234!' })
})).json();
const userToken = signIn?.access_token;
if (!userToken) { fail('Could not sign in test user', signIn); process.exit(1); }
ok(`Test user created and signed in`);

const userH = { apikey: ANON, Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' };

// ── Test 1: Table exists with correct columns ─────────────────────────────────
const cols = await rest('/rest/v1/user_consents?select=id,user_id,terms_accepted,privacy_accepted,community_accepted,age_confirmed,marketing_opted_in,consent_version,ip_address,user_agent,created_at&limit=0');
cols.ok ? ok('Table exists with all required columns') : fail('Table missing or columns wrong', cols.data);

// ── Test 2: User can insert own consent record ────────────────────────────────
const insertRes = await fetch(`${URL}/rest/v1/user_consents`, {
  method: 'POST',
  headers: { ...userH, Prefer: 'return=representation' },
  body: JSON.stringify({
    user_id: userId,
    terms_accepted: true,
    privacy_accepted: true,
    community_accepted: true,
    age_confirmed: true,
    marketing_opted_in: false,
    consent_version: '1.0',
    ip_address: '127.0.0.1',
    user_agent: 'test-script'
  })
});
const insertData = await insertRes.json();
insertRes.ok ? ok('User can insert own consent record') : fail('User insert failed', insertData);

// ── Test 3: User can read own consent record ──────────────────────────────────
const readRes = await fetch(`${URL}/rest/v1/user_consents?user_id=eq.${userId}&select=*`, {
  headers: userH
});
const readData = await readRes.json();
readRes.ok && readData?.length > 0 ? ok('User can read own consent record') : fail('User read failed', readData);

// ── Test 4: Consent values stored correctly ───────────────────────────────────
const record = readData?.[0];
record?.terms_accepted === true && record?.age_confirmed === true && record?.marketing_opted_in === false
  ? ok('Consent values stored correctly')
  : fail('Consent values wrong', record);

// ── Test 5: Admin can read all consents ───────────────────────────────────────
const adminRead = await rest(`/rest/v1/user_consents?user_id=eq.${userId}&select=*`);
adminRead.ok && adminRead.data?.length > 0 ? ok('Admin can read all consent records') : fail('Admin read failed', adminRead.data);

// ── Test 6: User cannot insert consent for another user (RLS) ─────────────────
const otherUserId = '00000000-0000-0000-0000-000000000001';
const rls = await fetch(`${URL}/rest/v1/user_consents`, {
  method: 'POST',
  headers: userH,
  body: JSON.stringify({ user_id: otherUserId, terms_accepted: true, privacy_accepted: true, community_accepted: true, age_confirmed: true })
});
!rls.ok ? ok('RLS blocks insert for another user') : fail('RLS should block cross-user insert');

// ── Test 7: types.ts has user_consents ───────────────────────────────────────
const { readFileSync } = await import('fs');
const types = readFileSync('src/integrations/supabase/types.ts', 'utf8');
types.includes('user_consents') ? ok('types.ts includes user_consents') : fail('user_consents missing from types.ts');

// ── Cleanup ───────────────────────────────────────────────────────────────────
await fetch(`${URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: SVC_H });
console.log('  🧹 Test user cleaned up');

console.log(`\n── Result: ${p} passed, ${f} failed ──`);
process.exit(f > 0 ? 1 : 0);
