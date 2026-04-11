/**
 * Sprint 10 — Arnold's Tasks Verification Script
 * Run: npx tsx scripts/test-s10-arnold.ts
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const FUNCTIONS = path.join(ROOT, 'supabase/functions');
const SCRIPTS = path.join(ROOT, 'scripts');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ❌ ${name}\n     ${e.message}`);
    failed++;
  }
}

function expect(val: any) {
  return {
    toBe: (expected: any) => { if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`); },
    toContain: (str: string) => { if (!val.includes(str)) throw new Error(`Expected to contain: "${str}"`); },
    not: {
      toContain: (str: string) => { if (val.includes(str)) throw new Error(`Expected NOT to contain: "${str}"`); },
      toBe: (expected: any) => { if (val === expected) throw new Error(`Expected not to be ${JSON.stringify(expected)}`); },
    },
    toBeGreaterThan: (n: number) => { if (!(val > n)) throw new Error(`Expected ${val} > ${n}`); },
    toBeLessThan: (n: number) => { if (!(val < n)) throw new Error(`Expected ${val} < ${n}`); },
    toEqual: (expected: any) => { if (JSON.stringify(val) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`); },
    toMatch: (re: RegExp) => { if (!re.test(val)) throw new Error(`Expected to match ${re}`); },
  };
}

function read(file: string) { return fs.readFileSync(file, 'utf-8'); }
function migration(name: string) { return read(path.join(MIGRATIONS, name)); }
function edgeFn(name: string) { return read(path.join(FUNCTIONS, name, 'index.ts')); }

// ── S10-001 ──────────────────────────────────────────────────────────────────
console.log('\nS10-001 / MOB-801 — DROP FUNCTION before notification_type drop');
const m1 = migration('20260319212624_remote_schema.sql');
const dropFnPos = m1.indexOf('DROP FUNCTION IF EXISTS public.create_booking_notification');
const dropTypePos = m1.indexOf('drop type "public"."notification_type__old_version_to_be_dropped"');
test('DROP FUNCTION statements exist', () => expect(dropFnPos).toBeGreaterThan(-1));
test('DROP FUNCTION appears before DROP TYPE', () => expect(dropFnPos).toBeLessThan(dropTypePos));
['create_booking_notification','create_notification_with_expiration','create_wallet_notification',
 'get_notification_expiration_info','get_user_notifications','update_notification_expiration_policy']
  .forEach(fn => test(`drops ${fn}`, () => expect(m1).toContain(`DROP FUNCTION IF EXISTS public.${fn}`)));

// ── S10-002 ──────────────────────────────────────────────────────────────────
console.log('\nS10-002 / MOB-802 — No redundant notification_type enum block');
const m2 = migration('20260328135949_remote_schema.sql');
test('no notification_type__old_version reference', () => expect(m2).not.toContain('notification_type__old_version_to_be_dropped'));
test('no rename to old version', () => expect(m2).not.toContain('rename to "notification_type__old_version_to_be_dropped"'));

// ── S10-003 ──────────────────────────────────────────────────────────────────
console.log('\nS10-003 / MOB-701 — No hardcoded secrets in scripts/');
const scriptFiles = fs.readdirSync(SCRIPTS).filter(f => fs.statSync(path.join(SCRIPTS, f)).isFile());
test('check_verifications.js deleted', () => expect(scriptFiles.includes('check_verifications.js')).toBe(false));
test('no hardcoded sbp_ key in scripts', () => {
  scriptFiles.forEach(f => {
    const c = read(path.join(SCRIPTS, f));
    if (/sbp_[A-Za-z0-9]{20,}/.test(c)) throw new Error(`Found sbp_ key in ${f}`);
  });
});
test('no hardcoded password= literal in scripts', () => {
  scriptFiles.forEach(f => {
    const c = read(path.join(SCRIPTS, f));
    if (/(?:password|PASSWORD)\s*=\s*['"][^'"]{6,}['"]/.test(c)) throw new Error(`Found hardcoded password in ${f}`);
  });
});

// ── S10-004 ──────────────────────────────────────────────────────────────────
console.log('\nS10-004 / MOB-702 — add-admin auth-gating');
const addAdmin = edgeFn('add-admin');
test('imports zod', () => expect(addAdmin).toContain('zod'));
test('calls getUser()', () => expect(addAdmin).toContain('getUser'));
test('returns 401', () => expect(addAdmin).toContain('401'));
test('checks is_super_admin', () => expect(addAdmin).toContain('is_super_admin'));
test('returns 403', () => expect(addAdmin).toContain('403'));
test('uses safeParse', () => expect(addAdmin).toContain('safeParse'));

// ── S10-005 ──────────────────────────────────────────────────────────────────
console.log('\nS10-005 / MOB-703 — Blanket notifications policy dropped');
const m5 = migration('20260409100000_fix_financial_tables_rls.sql');
test('drops blanket policy', () => expect(m5).toContain('DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."notifications"'));
test('remote schema has user_id scoped policy', () => expect(m1).toMatch(/auth\.uid\(\)\s*=\s*user_id|user_id.*auth\.uid\(\)/));

// ── S10-006 ──────────────────────────────────────────────────────────────────
console.log('\nS10-006 / MOB-704 — Financial tables RLS');
test('insurance_commission_rates RLS re-enabled', () => expect(m5).toContain('ALTER TABLE "public"."insurance_commission_rates" ENABLE ROW LEVEL SECURITY'));
test('commission_rates RLS enabled', () => expect(migration('20251126084309_create_missing_tables.sql')).toContain('ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY'));
test('wallet_transactions RLS enabled', () => expect(migration('20250726000000_create_wallet_transactions_table.sql')).toContain('ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY'));
test('admin-only policy on insurance_commission_rates', () => { expect(m5).toContain('insurance_commission_rates'); expect(m5).toContain('admins'); });

// ── S10-007 ──────────────────────────────────────────────────────────────────
console.log('\nS10-007 / MOB-705 — Zod validation on edge functions');
['initiate-payment','process-withdrawal','query-payment','add-admin'].forEach(name => {
  const fn = edgeFn(name);
  test(`${name}: imports zod`, () => expect(fn).toContain('zod'));
  test(`${name}: uses safeParse`, () => expect(fn).toContain('safeParse'));
  test(`${name}: returns 400 on bad input`, () => expect(fn).toContain('400'));
});
test('initiate-payment: validates booking_id as uuid', () => expect(edgeFn('initiate-payment')).toContain('uuid'));
test('initiate-payment: validates payment_method enum', () => expect(edgeFn('initiate-payment')).toMatch(/enum.*card|card.*enum/s));
test('process-withdrawal: validates action enum', () => expect(edgeFn('process-withdrawal')).toMatch(/approve.*reject|reject.*approve/));
test('query-payment: validates payment_transaction_id as uuid', () => expect(edgeFn('query-payment')).toContain('uuid'));

// ── S10-008 ──────────────────────────────────────────────────────────────────
console.log('\nS10-008 / MOB-706 — search_path migration');
const m8file = path.join(MIGRATIONS, '20260410170000_fix_function_search_paths.sql');
test('migration file exists', () => expect(fs.existsSync(m8file)).toBe(true));
const m8 = read(m8file);
['advance_handover_step','calculate_handover_progress','expire_insurance_policies','generate_claim_number',
 'generate_policy_number','handle_new_message_notification','increment_car_view_count',
 'increment_promo_code_uses','is_conversation_participant','update_insurance_updated_at','verify_audit_chain_integrity']
  .forEach(fn => test(`sets search_path on ${fn}`, () => { expect(m8).toContain(`ALTER FUNCTION public.${fn}`); expect(m8).toContain('SET search_path = public'); }));
test('does not touch extension functions', () => { expect(m8).not.toContain('http_'); expect(m8).not.toContain('urlencode'); });

// ── S10-022 ──────────────────────────────────────────────────────────────────
console.log('\nS10-022 / MOB-710 — SSRF domain whitelist');
const push = edgeFn('send-push-notification');
test('defines ALLOWED_PUSH_DOMAINS', () => expect(push).toContain('ALLOWED_PUSH_DOMAINS'));
test('includes fcm.googleapis.com', () => expect(push).toContain('fcm.googleapis.com'));
test('includes mozilla push domain', () => expect(push).toContain('mozilla.com'));
test('includes apple push domain', () => expect(push).toContain('web.push.apple.com'));
test('has isAllowedPushEndpoint function', () => expect(push).toContain('isAllowedPushEndpoint'));
test('returns 403 for disallowed endpoints', () => expect(push).toContain('403'));
test('validates endpoint before sending', () => expect(push.indexOf('isAllowedPushEndpoint')).toBeLessThan(push.indexOf('sendWebPushNotification')));

// ── FRONTEND ──────────────────────────────────────────────────────────────────
console.log('\nFrontend — File existence & structure checks');
const SRC = path.join(ROOT, 'src');
test('AdminManagementTable.tsx exists', () => expect(fs.existsSync(path.join(SRC, 'components/admin/AdminManagementTable.tsx'))).toBe(true));
test('BookingManagementTable.tsx exists', () => expect(fs.existsSync(path.join(SRC, 'components/admin/BookingManagementTable.tsx'))).toBe(true));
test('AdminSecurityPanel.tsx exists', () => expect(fs.existsSync(path.join(SRC, 'components/admin/AdminSecurityPanel.tsx'))).toBe(true));
test('AdminManagementTable references Table', () => expect(read(path.join(SRC, 'components/admin/AdminManagementTable.tsx'))).toMatch(/Table|table/));
test('BookingManagementTable references booking', () => expect(read(path.join(SRC, 'components/admin/BookingManagementTable.tsx'))).toMatch(/booking/i));

console.log('\nFrontend — No hardcoded secrets in src/');
function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules','.git','dist','__mocks__'].includes(e.name)) out.push(...walkTs(full));
    else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) out.push(full);
  }
  return out;
}
const srcFiles = walkTs(SRC);
test('no sbp_ key in src/', () => {
  const hits = srcFiles.filter(f => /sbp_[A-Za-z0-9]{20,}/.test(read(f)));
  if (hits.length) throw new Error(`Found in: ${hits.map(f => path.relative(ROOT, f)).join(', ')}`);
});
test('no hardcoded JWT in src/', () => {
  const hits = srcFiles.filter(f => /(?<![A-Z_])eyJ[A-Za-z0-9_\-]{50,}/.test(read(f)));
  if (hits.length) throw new Error(`Found in: ${hits.map(f => path.relative(ROOT, f)).join(', ')}`);
});

// ── S10-025 / MOB-711 ────────────────────────────────────────────────────────
console.log('\nS10-025 / MOB-711 — Admin Portal Detailed Views (Eye Icons)');
const ADMIN = path.join(SRC, 'components/admin');
const adminRead = (f: string) => read(path.join(ADMIN, f));

// Dialog files exist
test('BookingDetailsDialog.tsx exists', () => expect(fs.existsSync(path.join(ADMIN, 'BookingDetailsDialog.tsx'))).toBe(true));
test('finance/PayoutDetailsDialog.tsx exists', () => expect(fs.existsSync(path.join(ADMIN, 'finance/PayoutDetailsDialog.tsx'))).toBe(true));
test('finance/InsuranceCoverageDialog.tsx exists', () => expect(fs.existsSync(path.join(ADMIN, 'finance/InsuranceCoverageDialog.tsx'))).toBe(true));
test('MessageThreadViewer.tsx exists', () => expect(fs.existsSync(path.join(ADMIN, 'MessageThreadViewer.tsx'))).toBe(true));

// Dialogs are read-only (no mutations)
test('BookingDetailsDialog is read-only', () => { if (/\.update\(|\.delete\(/.test(adminRead('BookingDetailsDialog.tsx'))) throw new Error('contains mutation'); });
test('PayoutDetailsDialog is read-only', () => { if (/\.update\(|\.delete\(/.test(adminRead('finance/PayoutDetailsDialog.tsx'))) throw new Error('contains mutation'); });
test('InsuranceCoverageDialog is read-only', () => { if (/\.update\(|\.delete\(/.test(adminRead('finance/InsuranceCoverageDialog.tsx'))) throw new Error('contains mutation'); });
test('MessageThreadViewer is read-only', () => { if (/\.update\(|\.delete\(/.test(adminRead('MessageThreadViewer.tsx'))) throw new Error('contains mutation'); });

// Dialogs use react-query
test('BookingDetailsDialog uses useQuery', () => expect(adminRead('BookingDetailsDialog.tsx')).toContain('useQuery'));
test('PayoutDetailsDialog uses useQuery', () => expect(adminRead('finance/PayoutDetailsDialog.tsx')).toContain('useQuery'));
test('InsuranceCoverageDialog uses useQuery', () => expect(adminRead('finance/InsuranceCoverageDialog.tsx')).toContain('useQuery'));
test('MessageThreadViewer uses useQuery', () => expect(adminRead('MessageThreadViewer.tsx')).toContain('useQuery'));

// Eye wired in each table
test('BookingManagementTable: Eye + BookingDetailsDialog + state', () => {
  const c = adminRead('BookingManagementTable.tsx');
  expect(c).toContain('Eye'); expect(c).toContain('BookingDetailsDialog'); expect(c).toContain('selectedBookingId');
});
test('WithdrawalRequestsTable: Eye + PayoutDetailsDialog + state', () => {
  const c = adminRead('finance/WithdrawalRequestsTable.tsx');
  expect(c).toContain('Eye'); expect(c).toContain('PayoutDetailsDialog'); expect(c).toContain('selectedWithdrawalId');
});
test('InsuranceRemittanceTable: Eye + InsuranceCoverageDialog + state', () => {
  const c = adminRead('finance/InsuranceRemittanceTable.tsx');
  expect(c).toContain('Eye'); expect(c).toContain('InsuranceCoverageDialog'); expect(c).toContain('selectedPolicyId');
});
test('MessageManagementTable: Eye + MessageThreadViewer + state', () => {
  const c = adminRead('MessageManagementTable.tsx');
  expect(c).toContain('Eye'); expect(c).toContain('MessageThreadViewer'); expect(c).toContain('selectedConversationId');
});
test('CarManagementTable: Eye navigates to /car/:id', () => {
  const c = adminRead('CarManagementTable.tsx');
  expect(c).toContain('Eye'); expect(c).toMatch(/navigate\(`\/car\/\$\{car\.id\}`\)/);
});
test('TransactionLedgerTable: Eye + TransactionJourneyDialog + state', () => {
  const c = adminRead('TransactionLedgerTable.tsx');
  expect(c).toContain('Eye'); expect(c).toContain('TransactionJourneyDialog'); expect(c).toContain('journeyBookingId');
});

// Eye is actually used (not just imported) — must appear ≥2 times
['BookingManagementTable.tsx','finance/WithdrawalRequestsTable.tsx','finance/InsuranceRemittanceTable.tsx',
 'MessageManagementTable.tsx','CarManagementTable.tsx','TransactionLedgerTable.tsx'].forEach(f => {
  test(`${f}: Eye used in JSX (not just imported)`, () => {
    const count = (adminRead(f).match(/Eye/g) || []).length;
    if (count < 2) throw new Error(`Eye appears only ${count} time(s) — likely unused import`);
  });
});

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
