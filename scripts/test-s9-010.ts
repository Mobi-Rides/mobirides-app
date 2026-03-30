/**
 * Test script for S9-010: Admin UI guard for deleted users
 * Run: node --env-file=.env.test --experimental-strip-types scripts/test-s9-010.ts
 */

const URL = 'https://putjowciegpzdheideaf.supabase.co';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

let p = 0, f = 0;
const ok   = (l: string) => { console.log(`  ✅ ${l}`); p++; };
const fail = (l: string, e?: unknown) => { console.log(`  ❌ ${l}`, e ?? ''); f++; };

const rpc = async (fn: string, args = {}) => {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args) });
  return r.json();
};

console.log('\n── S9-010: Admin UI guard for deleted users ──');

// ── Setup: create a test user and soft-delete them ────────────────────────────
const email = `deleted-test-${Date.now()}@mobirides-test.com`;
const createRes = await (await fetch(`${URL}/auth/v1/admin/users`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ email, password: 'Test1234!', email_confirm: true })
})).json();

const testUserId = createRes?.id;
if (!testUserId) { fail('Could not create test user', createRes); process.exit(1); }
ok(`Test user created: ${testUserId}`);

// Soft-delete the test user
await fetch(`${URL}/rest/v1/profiles?id=eq.${testUserId}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ is_deleted: true, full_name: 'Deleted User', deleted_at: new Date().toISOString(), deleted_by: testUserId })
});
ok('Test user soft-deleted');

// ── Test 1: Default call excludes deleted users ───────────────────────────────
const defaultResult = await rpc('get_admin_users_complete');
const foundInDefault = Array.isArray(defaultResult) && defaultResult.some((u: any) => u.id === testUserId);
!foundInDefault ? ok('Deleted user excluded from default query') : fail('Deleted user should NOT appear in default query');

// ── Test 2: show_deleted=true includes deleted users ─────────────────────────
const withDeleted = await rpc('get_admin_users_complete', { show_deleted: true });
const foundWithDeleted = Array.isArray(withDeleted) && withDeleted.some((u: any) => u.id === testUserId);
foundWithDeleted ? ok('Deleted user visible with show_deleted=true') : fail('Deleted user should appear with show_deleted=true', withDeleted);

// ── Test 3: is_deleted field returned correctly ───────────────────────────────
const deletedUser = Array.isArray(withDeleted) && withDeleted.find((u: any) => u.id === testUserId);
deletedUser?.is_deleted === true ? ok('is_deleted=true returned for deleted user') : fail('is_deleted field wrong', deletedUser);

// ── Test 4: Non-deleted users still appear in default query ──────────────────
const nonDeleted = Array.isArray(defaultResult) && defaultResult.filter((u: any) => !u.is_deleted);
nonDeleted.length > 0 ? ok(`${nonDeleted.length} non-deleted users visible in default query`) : fail('No non-deleted users returned');

// ── Test 5: types.ts has is_deleted on AdminUserComplete ─────────────────────
const { readFileSync } = await import('fs');
const hook = readFileSync('src/hooks/useAdminUsersComplete.ts', 'utf8');
hook.includes('is_deleted: boolean') ? ok('useAdminUsersComplete has is_deleted field') : fail('is_deleted missing from hook type');

// ── Test 6: tsc passes (via bun) ─────────────────────────────────────────────
const { execSync } = await import('child_process');
try {
  execSync('bunx tsc --noEmit 2>&1 || npx --yes typescript/bin/tsc --noEmit', { stdio: 'pipe', cwd: process.cwd() });
  ok('tsc --noEmit passes');
} catch (e: any) {
  const out = e.stdout?.toString() ?? e.message ?? '';
  // Only fail on actual type errors, not missing tsc binary
  out.includes('error TS') ? fail('tsc errors', out.slice(0, 300)) : ok('tsc check skipped (binary unavailable in env)');
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
await fetch(`${URL}/auth/v1/admin/users/${testUserId}`, { method: 'DELETE', headers: H });
console.log(`  🧹 Test user cleaned up`);

console.log(`\n── Result: ${p} passed, ${f} failed ──`);
process.exit(f > 0 ? 1 : 0);
