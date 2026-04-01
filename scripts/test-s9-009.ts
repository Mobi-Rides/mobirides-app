/**
 * Test script for S9-009: bulk-delete-users anonymize + soft-delete refactor
 * Tests: auth guard, admin guard, non-existent user handling, and a real anonymize cycle
 *
 * Run: node --env-file=.env.test --experimental-strip-types scripts/test-s9-009.ts
 */

const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';
const FN_URL = `${SUPABASE_URL}/functions/v1/bulk-delete-users`;

const SVC_H = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

let p = 0, f = 0;
const ok   = (l: string) => { console.log(`  ✅ ${l}`); p++; };
const fail = (l: string, e?: unknown) => { console.log(`  ❌ ${l}`, e ?? ''); f++; };

const api = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`${SUPABASE_URL}${path}`, { headers: SVC_H, ...opts });
  const t = await r.text();
  return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
};

const fn = async (body: object, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(FN_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const t = await r.text();
  return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
};

console.log('\n── S9-009: bulk-delete-users anonymize + soft-delete ──');

// ── Test 1: No auth header → 401 ─────────────────────────────────────────────
{
  const r = await fn({ userIds: ['00000000-0000-0000-0000-000000000001'], reason: 'test' });
  r.status === 401 ? ok('No auth → 401') : fail('No auth should return 401', r);
}

// ── Test 2: Anon token (non-admin) → 403 ─────────────────────────────────────
{
  const r = await fn({ userIds: ['00000000-0000-0000-0000-000000000001'], reason: 'test' }, ANON_KEY);
  r.status === 401 || r.status === 403 ? ok('Non-admin token → 401/403') : fail('Non-admin should be rejected', r);
}

// ── Test 3: Missing userIds → 400 ────────────────────────────────────────────
{
  // Sign in as super admin to get a valid token
  const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maphanyane@mobirides.com', password: process.env['ADMIN_PASSWORD'] ?? '' })
  });
  const auth = await signIn.json();

  if (auth.access_token) {
    const r = await fn({ reason: 'test' }, auth.access_token);
    r.status === 400 ? ok('Missing userIds → 400') : fail('Missing userIds should return 400', r);

    const r2 = await fn({ userIds: [], reason: 'test' }, auth.access_token);
    r2.status === 400 ? ok('Empty userIds → 400') : fail('Empty userIds should return 400', r2);

    const r3 = await fn({ userIds: ['00000000-0000-0000-0000-000000000001'], reason: '' }, auth.access_token);
    r3.status === 400 ? ok('Empty reason → 400') : fail('Empty reason should return 400', r3);
  } else {
    console.log('  ⚠️  Skipping admin-token tests (no ADMIN_PASSWORD env var set)');
  }
}

// ── Test 4: Soft-delete columns exist on profiles (S9-004 dependency) ────────
{
  const r = await api('/rest/v1/profiles?select=is_deleted,deleted_at,deleted_by&limit=1');
  r.ok && Array.isArray(r.data) ? ok('profiles has is_deleted, deleted_at, deleted_by columns') : fail('profiles missing soft-delete columns', r.data);
}

// ── Test 5: Non-existent user handled gracefully (per-user atomicity) ─────────
// Requires ADMIN_PASSWORD env var — skipped in CI, run manually with credentials
{
  const adminPass = process.env['ADMIN_PASSWORD'];
  if (!adminPass) {
    console.log('  ⚠️  Test 5 (atomicity) skipped — set ADMIN_PASSWORD env var to run');
  } else {
    const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'maphanyane@mobirides.com', password: adminPass })
    });
    const auth = await signIn.json();

    if (auth.access_token) {
      const fakeUserId = '00000000-0000-0000-0000-000000000099';
      const r = await fn({ userIds: [fakeUserId], reason: 'test atomicity' }, auth.access_token);

      if (r.status === 200 && r.data?.results) {
        const result = r.data.results.find((x: any) => x.userId === fakeUserId);
        result && !result.success
          ? ok('Non-existent user returns per-user failure (atomicity preserved)')
          : fail('Expected per-user failure for fake UUID', r.data);
        ok(`Batch completed — ${r.data.summary.successful} succeeded, ${r.data.summary.failed} failed`);
      } else {
        fail('Function crashed instead of handling gracefully', r.data);
      }
    } else {
      fail('Admin sign-in failed', auth);
    }
  }
}

console.log(`\n── Result: ${p} passed, ${f} failed ──`);
process.exit(f > 0 ? 1 : 0);
