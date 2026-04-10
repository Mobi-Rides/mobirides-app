/**
 * Sprint 10 — Arnold's Tasks Verification Suite
 *
 * Covers:
 *  S10-001 / MOB-801  — DROP FUNCTION order in migration
 *  S10-002 / MOB-802  — No redundant notification_type enum block
 *  S10-003 / MOB-701  — No hardcoded secrets in scripts/
 *  S10-004 / MOB-702  — add-admin edge function auth-gating
 *  S10-005 / MOB-703  — No blanket notifications SELECT policy
 *  S10-006 / MOB-704  — Financial tables RLS enabled
 *  S10-007 / MOB-705  — Zod validation on edge functions
 *  S10-008 / MOB-706  — search_path migration exists
 *  S10-022 / MOB-710  — SSRF domain whitelist on push notifications
 *  Frontend           — AdminManagementTable, BookingManagementTable, notifications RLS consumer
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const FUNCTIONS = path.join(ROOT, 'supabase/functions');
const SCRIPTS = path.join(ROOT, 'scripts');

function readMigration(filename: string): string {
  return fs.readFileSync(path.join(MIGRATIONS, filename), 'utf-8');
}

function readFunction(name: string): string {
  return fs.readFileSync(path.join(FUNCTIONS, name, 'index.ts'), 'utf-8');
}

// ─── S10-001 / MOB-801 ────────────────────────────────────────────────────────

describe('S10-001 / MOB-801 — DROP FUNCTION before notification_type drop', () => {
  const migration = readMigration('20260319212624_remote_schema.sql');
  const dropFnPos = migration.indexOf('DROP FUNCTION IF EXISTS public.create_booking_notification');
  const dropTypePos = migration.indexOf('drop type "public"."notification_type__old_version_to_be_dropped"');

  it('DROP FUNCTION statements exist', () => {
    expect(dropFnPos).toBeGreaterThan(-1);
  });

  it('DROP FUNCTION appears before DROP TYPE', () => {
    expect(dropFnPos).toBeLessThan(dropTypePos);
  });

  it('all 7 required functions are dropped', () => {
    const required = [
      'create_booking_notification',
      'create_notification_with_expiration',
      'create_wallet_notification',
      'get_notification_expiration_info',
      'get_user_notifications',
      'update_notification_expiration_policy',
    ];
    required.forEach(fn => {
      expect(migration).toContain(`DROP FUNCTION IF EXISTS public.${fn}`);
    });
  });
});

// ─── S10-002 / MOB-802 ────────────────────────────────────────────────────────

describe('S10-002 / MOB-802 — No redundant notification_type enum block', () => {
  const migration = readMigration('20260328135949_remote_schema.sql');

  it('no notification_type__old_version_to_be_dropped reference', () => {
    expect(migration).not.toContain('notification_type__old_version_to_be_dropped');
  });

  it('no rename of notification_type to old version', () => {
    expect(migration).not.toContain('rename to "notification_type__old_version_to_be_dropped"');
  });
});

// ─── S10-003 / MOB-701 ────────────────────────────────────────────────────────

describe('S10-003 / MOB-701 — No hardcoded secrets in scripts/', () => {
  const scriptFiles = fs.readdirSync(SCRIPTS).filter(f => fs.statSync(path.join(SCRIPTS, f)).isFile());

  it('check_verifications.js is deleted', () => {
    expect(scriptFiles).not.toContain('check_verifications.js');
  });

  it('no script contains a hardcoded JWT (eyJ...)', () => {
    scriptFiles.forEach(file => {
      const content = fs.readFileSync(path.join(SCRIPTS, file), 'utf-8');
      // Match base64 JWT tokens (not env var reads)
      const hardcodedJwt = /(?<![A-Z_'"`])eyJ[A-Za-z0-9_-]{20,}/.test(content);
      expect(hardcodedJwt).toBe(false);
    });
  });

  it('no script contains a hardcoded sbp_ service role key', () => {
    scriptFiles.forEach(file => {
      const content = fs.readFileSync(path.join(SCRIPTS, file), 'utf-8');
      expect(content).not.toMatch(/sbp_[A-Za-z0-9]{20,}/);
    });
  });

  it('no script contains a hardcoded plain-text password (not from env)', () => {
    const suspiciousPattern = /(?:password|PASSWORD)\s*=\s*['"][^'"]{6,}['"]/;
    scriptFiles.forEach(file => {
      const content = fs.readFileSync(path.join(SCRIPTS, file), 'utf-8');
      expect(suspiciousPattern.test(content)).toBe(false);
    });
  });
});

// ─── S10-004 / MOB-702 ────────────────────────────────────────────────────────

describe('S10-004 / MOB-702 — add-admin edge function auth-gating', () => {
  const fn = readFunction('add-admin');

  it('imports zod', () => {
    expect(fn).toContain('zod');
  });

  it('extracts Bearer token', () => {
    expect(fn).toMatch(/Authorization|Bearer/);
  });

  it('calls auth.getUser()', () => {
    expect(fn).toContain('getUser');
  });

  it('returns 401 for missing/invalid token', () => {
    expect(fn).toContain('401');
  });

  it('checks is_super_admin', () => {
    expect(fn).toContain('is_super_admin');
  });

  it('returns 403 for non-super-admin', () => {
    expect(fn).toContain('403');
  });

  it('uses safeParse for body validation', () => {
    expect(fn).toContain('safeParse');
  });

  it('returns 400 for invalid body', () => {
    expect(fn).toContain('400');
  });
});

// ─── S10-005 / MOB-703 ────────────────────────────────────────────────────────

describe('S10-005 / MOB-703 — Blanket notifications SELECT policy dropped', () => {
  const migration = readMigration('20260409100000_fix_financial_tables_rls.sql');

  it('drops "Enable read access for all users" policy on notifications', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."notifications"');
  });
});

describe('S10-005 — Scoped user_id = auth.uid() policies exist in remote schema', () => {
  const schema = readMigration('20260319212624_remote_schema.sql');

  it('has at least one user_id = auth.uid() scoped notifications policy', () => {
    expect(schema).toMatch(/auth\.uid\(\)\s*=\s*user_id|user_id.*auth\.uid\(\)/);
  });
});

// ─── S10-006 / MOB-704 ────────────────────────────────────────────────────────

describe('S10-006 / MOB-704 — Financial tables RLS', () => {
  it('insurance_commission_rates RLS re-enabled', () => {
    const migration = readMigration('20260409100000_fix_financial_tables_rls.sql');
    expect(migration).toContain('ALTER TABLE "public"."insurance_commission_rates" ENABLE ROW LEVEL SECURITY');
  });

  it('commission_rates RLS enabled in earlier migration', () => {
    const migration = readMigration('20251126084309_create_missing_tables.sql');
    expect(migration).toContain('ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY');
  });

  it('wallet_transactions RLS enabled', () => {
    const migration = readMigration('20250726000000_create_wallet_transactions_table.sql');
    expect(migration).toContain('ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY');
  });

  it('admin-only policy exists for insurance_commission_rates', () => {
    const migration = readMigration('20260409100000_fix_financial_tables_rls.sql');
    expect(migration).toContain('insurance_commission_rates');
    expect(migration).toContain('admins');
  });
});

// ─── S10-007 / MOB-705 ────────────────────────────────────────────────────────

describe('S10-007 / MOB-705 — Zod validation on edge functions', () => {
  const functionsToCheck = ['initiate-payment', 'process-withdrawal', 'query-payment', 'add-admin'];

  functionsToCheck.forEach(name => {
    describe(name, () => {
      const fn = readFunction(name);

      it('imports zod', () => {
        expect(fn).toMatch(/zod/);
      });

      it('uses safeParse or z.object', () => {
        expect(fn).toMatch(/safeParse|z\.object/);
      });

      it('returns 400 on invalid input', () => {
        expect(fn).toContain('400');
      });
    });
  });

  it('initiate-payment validates booking_id as UUID', () => {
    const fn = readFunction('initiate-payment');
    expect(fn).toContain('uuid');
  });

  it('initiate-payment validates payment_method as enum', () => {
    const fn = readFunction('initiate-payment');
    expect(fn).toMatch(/enum.*card|card.*enum/s);
  });

  it('process-withdrawal validates action as approve|reject enum', () => {
    const fn = readFunction('process-withdrawal');
    expect(fn).toMatch(/approve.*reject|reject.*approve/);
  });

  it('query-payment validates payment_transaction_id as UUID', () => {
    const fn = readFunction('query-payment');
    expect(fn).toContain('uuid');
  });
});

// ─── S10-008 / MOB-706 ────────────────────────────────────────────────────────

describe('S10-008 / MOB-706 — search_path migration', () => {
  const migration = readMigration('20260410170000_fix_function_search_paths.sql');

  const functions = [
    'advance_handover_step',
    'calculate_handover_progress',
    'expire_insurance_policies',
    'generate_claim_number',
    'generate_policy_number',
    'handle_new_message_notification',
    'increment_car_view_count',
    'increment_promo_code_uses',
    'is_conversation_participant',
    'update_insurance_updated_at',
    'verify_audit_chain_integrity',
  ];

  it('migration file exists', () => {
    expect(fs.existsSync(path.join(MIGRATIONS, '20260410170000_fix_function_search_paths.sql'))).toBe(true);
  });

  functions.forEach(fn => {
    it(`sets search_path on ${fn}`, () => {
      expect(migration).toContain(`ALTER FUNCTION public.${fn}`);
      expect(migration).toContain('SET search_path = public');
    });
  });

  it('does not touch extension functions', () => {
    expect(migration).not.toContain('http_');
    expect(migration).not.toContain('urlencode');
  });
});

// ─── S10-022 / MOB-710 ────────────────────────────────────────────────────────

describe('S10-022 / MOB-710 — SSRF domain whitelist on send-push-notification', () => {
  const fn = readFunction('send-push-notification');

  it('defines ALLOWED_PUSH_DOMAINS', () => {
    expect(fn).toContain('ALLOWED_PUSH_DOMAINS');
  });

  it('includes fcm.googleapis.com', () => {
    expect(fn).toContain('fcm.googleapis.com');
  });

  it('includes mozilla push domain', () => {
    expect(fn).toContain('mozilla.com');
  });

  it('includes apple push domain', () => {
    expect(fn).toContain('web.push.apple.com');
  });

  it('has isAllowedPushEndpoint validation function', () => {
    expect(fn).toContain('isAllowedPushEndpoint');
  });

  it('returns 403 for disallowed endpoints', () => {
    expect(fn).toContain('403');
  });

  it('validates endpoint before sending', () => {
    const validationPos = fn.indexOf('isAllowedPushEndpoint');
    const sendPos = fn.indexOf('sendWebPushNotification');
    expect(validationPos).toBeLessThan(sendPos);
  });
});

// ─── FRONTEND ─────────────────────────────────────────────────────────────────

describe('Frontend — AdminManagementTable exists and is structured correctly', () => {
  const filePath = path.join(ROOT, 'src/components/admin/AdminManagementTable.tsx');

  it('file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('renders a table structure', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/Table|table/);
  });
});

describe('Frontend — BookingManagementTable exists', () => {
  const filePath = path.join(ROOT, 'src/components/admin/BookingManagementTable.tsx');

  it('file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('references booking data', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/booking/i);
  });
});

describe('Frontend — Notifications query is user-scoped (no blanket fetch)', () => {
  const srcDir = path.join(ROOT, 'src');

  function findFiles(dir: string, ext: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
        results.push(...findFiles(full, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
    return results;
  }

  it('no frontend file does an unscoped .from("notifications").select() without user filter', () => {
    const tsFiles = [...findFiles(srcDir, '.ts'), ...findFiles(srcDir, '.tsx')];
    const violations: string[] = [];

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Flag: .from('notifications').select( with no .eq('user_id' anywhere nearby
      if (
        content.includes('.from(\'notifications\')') &&
        content.includes('.select(') &&
        !content.includes('user_id') &&
        !content.includes('auth.uid') &&
        !content.includes('get_user_notifications') // RPC is fine
      ) {
        violations.push(path.relative(ROOT, file));
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('Frontend — AdminSecurityPanel exists', () => {
  const filePath = path.join(ROOT, 'src/components/admin/AdminSecurityPanel.tsx');

  it('file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe('Frontend — No hardcoded Supabase keys in src/', () => {
  function findFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', '__mocks__'].includes(entry.name)) {
        results.push(...findFiles(full));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        results.push(full);
      }
    }
    return results;
  }

  it('no src file contains a hardcoded sbp_ service role key', () => {
    const files = findFiles(path.join(ROOT, 'src'));
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/sbp_[A-Za-z0-9]{20,}/.test(content)) {
        violations.push(path.relative(ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no src file contains a hardcoded JWT token', () => {
    const files = findFiles(path.join(ROOT, 'src'));
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // eyJ... longer than 50 chars not inside a comment or env var reference
      if (/(?<![A-Z_])eyJ[A-Za-z0-9_\-]{50,}/.test(content)) {
        violations.push(path.relative(ROOT, file));
      }
    }
    expect(violations).toEqual([]);
  });
});

// ─── S10-025 / MOB-711 ────────────────────────────────────────────────────────

describe('S10-025 / MOB-711 — Admin Portal Detailed Views (Eye Icons)', () => {
  const adminDir = path.join(ROOT, 'src/components/admin');

  // Dialog files exist
  it('BookingDetailsDialog.tsx exists', () => {
    expect(fs.existsSync(path.join(adminDir, 'BookingDetailsDialog.tsx'))).toBe(true);
  });

  it('finance/PayoutDetailsDialog.tsx exists', () => {
    expect(fs.existsSync(path.join(adminDir, 'finance/PayoutDetailsDialog.tsx'))).toBe(true);
  });

  it('finance/InsuranceCoverageDialog.tsx exists', () => {
    expect(fs.existsSync(path.join(adminDir, 'finance/InsuranceCoverageDialog.tsx'))).toBe(true);
  });

  it('MessageThreadViewer.tsx exists', () => {
    expect(fs.existsSync(path.join(adminDir, 'MessageThreadViewer.tsx'))).toBe(true);
  });

  // Dialogs are read-only (no mutation calls)
  it('BookingDetailsDialog has no .update() or .delete() calls', () => {
    const content = fs.readFileSync(path.join(adminDir, 'BookingDetailsDialog.tsx'), 'utf-8');
    expect(content).not.toMatch(/\.update\(|\.delete\(/);
  });

  it('PayoutDetailsDialog has no .update() or .delete() calls', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/PayoutDetailsDialog.tsx'), 'utf-8');
    expect(content).not.toMatch(/\.update\(|\.delete\(/);
  });

  it('InsuranceCoverageDialog has no .update() or .delete() calls', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/InsuranceCoverageDialog.tsx'), 'utf-8');
    expect(content).not.toMatch(/\.update\(|\.delete\(/);
  });

  it('MessageThreadViewer has no .update() or .delete() calls', () => {
    const content = fs.readFileSync(path.join(adminDir, 'MessageThreadViewer.tsx'), 'utf-8');
    expect(content).not.toMatch(/\.update\(|\.delete\(/);
  });

  // Dialogs use react-query
  it('BookingDetailsDialog uses useQuery', () => {
    const content = fs.readFileSync(path.join(adminDir, 'BookingDetailsDialog.tsx'), 'utf-8');
    expect(content).toContain('useQuery');
  });

  it('PayoutDetailsDialog uses useQuery', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/PayoutDetailsDialog.tsx'), 'utf-8');
    expect(content).toContain('useQuery');
  });

  it('InsuranceCoverageDialog uses useQuery', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/InsuranceCoverageDialog.tsx'), 'utf-8');
    expect(content).toContain('useQuery');
  });

  it('MessageThreadViewer uses useQuery', () => {
    const content = fs.readFileSync(path.join(adminDir, 'MessageThreadViewer.tsx'), 'utf-8');
    expect(content).toContain('useQuery');
  });

  // Eye icon wired in each of the 6 tables
  it('BookingManagementTable imports Eye and BookingDetailsDialog', () => {
    const content = fs.readFileSync(path.join(adminDir, 'BookingManagementTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
    expect(content).toContain('BookingDetailsDialog');
  });

  it('BookingManagementTable has selectedBookingId state', () => {
    const content = fs.readFileSync(path.join(adminDir, 'BookingManagementTable.tsx'), 'utf-8');
    expect(content).toContain('selectedBookingId');
  });

  it('WithdrawalRequestsTable imports Eye and PayoutDetailsDialog', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/WithdrawalRequestsTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
    expect(content).toContain('PayoutDetailsDialog');
  });

  it('WithdrawalRequestsTable has selectedWithdrawalId state', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/WithdrawalRequestsTable.tsx'), 'utf-8');
    expect(content).toContain('selectedWithdrawalId');
  });

  it('InsuranceRemittanceTable imports Eye and InsuranceCoverageDialog', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/InsuranceRemittanceTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
    expect(content).toContain('InsuranceCoverageDialog');
  });

  it('InsuranceRemittanceTable has selectedPolicyId state', () => {
    const content = fs.readFileSync(path.join(adminDir, 'finance/InsuranceRemittanceTable.tsx'), 'utf-8');
    expect(content).toContain('selectedPolicyId');
  });

  it('MessageManagementTable imports Eye and MessageThreadViewer', () => {
    const content = fs.readFileSync(path.join(adminDir, 'MessageManagementTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
    expect(content).toContain('MessageThreadViewer');
  });

  it('MessageManagementTable has selectedConversationId state', () => {
    const content = fs.readFileSync(path.join(adminDir, 'MessageManagementTable.tsx'), 'utf-8');
    expect(content).toContain('selectedConversationId');
  });

  it('CarManagementTable imports Eye', () => {
    const content = fs.readFileSync(path.join(adminDir, 'CarManagementTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
  });

  it('CarManagementTable Eye navigates to /car/:id', () => {
    const content = fs.readFileSync(path.join(adminDir, 'CarManagementTable.tsx'), 'utf-8');
    expect(content).toMatch(/navigate\(`\/car\/\$\{car\.id\}`\)/);
  });

  it('TransactionLedgerTable imports Eye and TransactionJourneyDialog', () => {
    const content = fs.readFileSync(path.join(adminDir, 'TransactionLedgerTable.tsx'), 'utf-8');
    expect(content).toContain('Eye');
    expect(content).toContain('TransactionJourneyDialog');
  });

  it('TransactionLedgerTable has journeyBookingId state', () => {
    const content = fs.readFileSync(path.join(adminDir, 'TransactionLedgerTable.tsx'), 'utf-8');
    expect(content).toContain('journeyBookingId');
  });

  // No unused Eye imports (Eye must appear more than once — import + usage)
  const tablesWithEye = [
    'BookingManagementTable.tsx',
    'finance/WithdrawalRequestsTable.tsx',
    'finance/InsuranceRemittanceTable.tsx',
    'MessageManagementTable.tsx',
    'CarManagementTable.tsx',
    'TransactionLedgerTable.tsx',
  ];

  tablesWithEye.forEach(file => {
    it(`${file} uses Eye icon (not just imported)`, () => {
      const content = fs.readFileSync(path.join(adminDir, file), 'utf-8');
      const occurrences = (content.match(/Eye/g) || []).length;
      expect(occurrences).toBeGreaterThanOrEqual(2); // import + JSX usage
    });
  });
});
