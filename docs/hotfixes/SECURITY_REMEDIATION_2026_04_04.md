# Security Remediation Plan — MOB-700 Series
**Date:** 2026-04-04  
**Epic:** Security Hardening Sprint  
**Author:** Modisa Maphanyane  
**Status:** 🔴 Planned  

---

## Overview

Security scan identified **9 actionable findings** across database (RLS, functions, policies), edge functions (auth/validation), credential exposure, and plaintext password storage. This plan addresses all unresolved, non-ignored items in priority order.

---

## Tickets

### MOB-701 — Remove Hardcoded Secrets from Scripts

| Field | Detail |
|-------|--------|
| **Priority** | 🔴 Critical |
| **Type** | Security / Credential Exposure |
| **Affects** | `scripts/check-restrictions-by-phone.cjs` |
| **Status** | To Do |

**Description:**  
Service role key, admin email, and admin password are hardcoded in a git-tracked file (lines 5-9).

**Acceptance Criteria:**
- [ ] Delete `scripts/check-restrictions-by-phone.cjs` entirely, or replace all secrets with `process.env.*` references
- [ ] Rotate the service role key in Supabase Dashboard (Settings > API)
- [ ] Rotate the admin password referenced in the script
- [ ] Verify no other scripts contain hardcoded secrets (`grep -r "service_role" scripts/`)

**Impact Assessment:**  
No runtime consumers — script is a dev-only diagnostic tool. Safe to delete.

---

### MOB-702 — Auth-Gate `add-admin` Edge Function

| Field | Detail |
|-------|--------|
| **Priority** | 🔴 Critical |
| **Type** | API Security / Privilege Escalation |
| **Affects** | `supabase/functions/add-admin/index.ts` |
| **Status** | To Do |

**Description:**  
The `add-admin` edge function has **zero authentication or authorization**. Any request with a valid JSON body can create a super admin.

**Acceptance Criteria:**
- [ ] Extract and verify `Authorization` Bearer token via `supabaseClient.auth.getUser()`
- [ ] Look up the caller in the `admins` table; reject if not found or not `is_super_admin`
- [ ] Return 401 for missing/invalid token, 403 for non-admin callers
- [ ] Add Zod validation for request body (`userId: z.string().uuid()`, `isSuperAdmin: z.boolean()`, `userName: z.string().max(100).optional()`)
- [ ] Verify existing admin creation flow still works end-to-end

**Consumer Search:**
```bash
grep -r "add-admin" src/ --include="*.ts" --include="*.tsx"
```
Consumers: `src/hooks/useAdminManagement.ts` (invokes via `supabase.functions.invoke('add-admin', ...)`)

**Risk:** Low — adding auth headers is additive; the frontend already sends auth tokens.

---

### MOB-703 — Drop Blanket Notifications Read Policy

| Field | Detail |
|-------|--------|
| **Priority** | 🔴 Critical |
| **Type** | Data Privacy / RLS |
| **Affects** | `notifications` table |
| **Status** | To Do |

**Migration:** `YYYYMMDDHHMMSS_drop_blanket_notifications_policy.sql`

**Description:**  
`"Enable read access for all users"` on `notifications` uses `qual: true`, exposing all 258+ notifications to any authenticated user.

**Acceptance Criteria:**
- [ ] Drop the blanket policy
- [ ] Add an admin-scoped SELECT policy so admins retain global visibility
- [ ] Verify `NotificationsSection.tsx` still loads user-scoped notifications correctly
- [ ] Verify admin notification views (if any) continue to work

**SQL:**
```sql
-- Consumers: src/components/notifications/NotificationsSection.tsx, src/hooks/useNotifications.ts
-- Impact: Removes blanket read; adds admin-only global read; user-scoped policy already exists

DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;

CREATE POLICY "Admins can read all notifications"
  ON notifications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
```

**Consumer Search:**
```bash
grep -r "notifications" src/ --include="*.ts" --include="*.tsx" | grep -i "from\|select"
```

**Impact:** The existing `notifications_select_policy` (`user_id = auth.uid()`) handles all user reads. Admin policy ensures no admin-side breakage.

---

### MOB-704 — Enable RLS on Financial Tables

| Field | Detail |
|-------|--------|
| **Priority** | 🟠 High |
| **Type** | Data Exposure / RLS |
| **Affects** | `insurance_commission_rates`, `premium_remittance_batches` |
| **Status** | To Do |

**Migration:** `YYYYMMDDHHMMSS_enable_rls_financial_tables.sql`

**Description:**  
Two public tables have RLS disabled, exposing internal financial data.

**Acceptance Criteria:**
- [ ] Enable RLS on both tables
- [ ] Add admin-only SELECT and ALL policies using `public.is_admin()`
- [ ] Verify `AdminRemittanceDashboard.tsx` loads correctly for admin users
- [ ] Verify no public/renter views query these tables

**SQL:**
```sql
-- Consumers: src/components/admin/AdminRemittanceDashboard.tsx
-- Impact: Adds RLS to previously unprotected financial tables; admin-only access

ALTER TABLE insurance_commission_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view insurance commission rates"
  ON insurance_commission_rates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage insurance commission rates"
  ON insurance_commission_rates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

ALTER TABLE premium_remittance_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view remittance batches"
  ON premium_remittance_batches FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage remittance batches"
  ON premium_remittance_batches FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));
```

**Consumer Search:**
```bash
grep -r "insurance_commission_rates\|premium_remittance_batches" src/ --include="*.ts" --include="*.tsx"
```

**Risk:** None for non-admin users (they don't query these tables). Admin users are already authenticated.

---

### MOB-705 — Input Validation on Edge Functions

| Field | Detail |
|-------|--------|
| **Priority** | 🟠 High |
| **Type** | Input Security |
| **Affects** | `supabase/functions/add-admin/`, `supabase/functions/assign-role/`, `supabase/functions/bulk-assign-role/` |
| **Status** | To Do |

**Description:**  
Edge functions accept user input without UUID format or type validation, enabling potential injection or malformed data.

**Acceptance Criteria:**
- [ ] Add Zod validation schemas to all three functions
- [ ] `userId`: `z.string().uuid()`
- [ ] `role`: `z.enum(['renter', 'host', 'admin', 'super_admin'])`
- [ ] `userIds`: `z.array(z.string().uuid())`
- [ ] `isSuperAdmin`: `z.boolean().default(false)`
- [ ] `userName`: `z.string().max(100).optional()`
- [ ] Return 400 with descriptive error for validation failures
- [ ] Verify all admin UI flows still function correctly

**Risk:** Low — validation is additive; existing valid payloads will pass.

---

### MOB-706 — Fix Mutable `search_path` on Public Functions

| Field | Detail |
|-------|--------|
| **Priority** | 🟡 Medium |
| **Type** | DB Hardening |
| **Affects** | 11 public functions |
| **Status** | To Do |

**Migration:** `YYYYMMDDHHMMSS_fix_function_search_paths.sql`

**Description:**  
11 user-defined functions lack `SET search_path = public`, making them vulnerable to search_path injection.

**Functions:**
- `advance_handover_step`
- `bytea_to_text` / `text_to_bytea`
- `calculate_handover_progress`
- `expire_insurance_policies`
- `generate_claim_number` / `generate_policy_number`
- `handle_new_message_notification`
- `increment_car_view_count`
- `increment_promo_code_uses`
- `is_conversation_participant`
- `update_insurance_updated_at`
- `verify_audit_chain_integrity`

**Acceptance Criteria:**
- [ ] Run `ALTER FUNCTION public.<name>(...) SET search_path = public;` for each function
- [ ] Do NOT modify extension functions (`http_*`, `urlencode`)
- [ ] Run `npm run build` to verify no type changes
- [ ] Verify handover, messaging, and insurance flows still work

**SQL Pattern:**
```sql
-- Consumers: Multiple hooks and components (see consumer search)
-- Impact: Adds search_path restriction; no signature or return type changes

ALTER FUNCTION public.advance_handover_step(uuid, uuid) SET search_path = public;
-- ... (repeat for each function with correct argument signatures)
```

**Consumer Search:**
```bash
grep -r "advance_handover_step\|calculate_handover_progress\|expire_insurance\|generate_claim\|generate_policy\|increment_car_view\|increment_promo\|is_conversation_participant" src/ --include="*.ts" --include="*.tsx"
```

**Risk:** None — `SET search_path` is metadata-only; does not change function behavior.

---

### MOB-707 — Hash Passwords in `pending_confirmations`

| Field | Detail |
|-------|--------|
| **Priority** | 🟡 Medium |
| **Type** | Credential Storage |
| **Affects** | `pending_confirmations` table, signup edge function |
| **Status** | To Do |

**Migration:** `YYYYMMDDHHMMSS_hash_pending_confirmation_passwords.sql`

**Description:**  
The `pending_confirmations` table stores passwords in plaintext.

**Acceptance Criteria:**
- [ ] Add `password_hash` column to `pending_confirmations`
- [ ] Update signup edge function to hash passwords with `pgcrypto`: `crypt(password, gen_salt('bf'))`
- [ ] Update confirmation edge function to verify with `crypt(input, password_hash) = password_hash`
- [ ] Backfill existing rows (hash current plaintext values)
- [ ] After stable deployment, drop the `password` column
- [ ] Verify full signup → email confirmation → login flow works end-to-end

**Consumer Search:**
```bash
grep -r "pending_confirmations" src/ supabase/functions/ --include="*.ts" --include="*.tsx"
```

**Risk:** ⚠️ **High** — Requires atomic updates to both write (signup) and verify (confirm) paths. Deploy both simultaneously to avoid breaking in-flight signups.

**Rollback:** Keep `password` column until `password_hash` migration is confirmed stable. Revert edge functions to read plaintext if needed.

---

### MOB-708 — Create `blog_posts_public` View

| Field | Detail |
|-------|--------|
| **Priority** | 🟢 Low |
| **Type** | Data Exposure |
| **Affects** | `blog_posts` table, blog frontend components |
| **Status** | To Do |

**Migration:** `YYYYMMDDHHMMSS_create_blog_posts_public_view.sql`

**Description:**  
Blog posts expose `author_email` to unauthenticated users via public SELECT policies.

**Acceptance Criteria:**
- [ ] Create `blog_posts_public` view excluding `author_email`
- [ ] Grant SELECT to `anon` and `authenticated`
- [ ] Update frontend blog queries to use `blog_posts_public`
- [ ] Verify blog listing and detail pages render correctly
- [ ] Verify admin blog management still uses the full `blog_posts` table

**SQL:**
```sql
-- Consumers: src/pages/Blog.tsx, src/pages/BlogPost.tsx
-- Impact: Creates read-only view without author_email; no breaking changes

CREATE OR REPLACE VIEW public.blog_posts_public AS
SELECT id, title, slug, excerpt, content, category, tags,
  featured_image, social_image, meta_description,
  status, published_at, created_at, updated_at,
  author_name, author_bio, author_image,
  read_time, view_count
FROM blog_posts
WHERE status = 'published' AND published_at <= now();

GRANT SELECT ON blog_posts_public TO anon, authenticated;
```

**Consumer Search:**
```bash
grep -r "blog_posts" src/ --include="*.ts" --include="*.tsx"
```

**Risk:** Low — additive view; existing admin queries remain on the base table.

---

### MOB-709 — Enable Leaked Password Protection

| Field | Detail |
|-------|--------|
| **Priority** | 🟢 Low |
| **Type** | Auth Config |
| **Affects** | Supabase Auth settings |
| **Status** | To Do |

**Description:**  
Enable "Leaked Password Protection" (HaveIBeenPwned integration) via Supabase Dashboard.

**Acceptance Criteria:**
- [ ] Navigate to Supabase Dashboard > Authentication > Settings
- [ ] Enable "Leaked Password Protection"
- [ ] Verify new user signup rejects known-compromised passwords

**Risk:** None — dashboard toggle, no code changes.

---

## Execution Order

| Phase | Tickets | Risk | Dependencies |
|-------|---------|------|-------------|
| **Phase 1** | MOB-701, MOB-709 | None | None (manual actions) |
| **Phase 2** | MOB-702, MOB-705 | Low | None |
| **Phase 3** | MOB-703, MOB-704 | Low | Requires build verification |
| **Phase 4** | MOB-706 | None | Requires function signature lookup |
| **Phase 5** | MOB-707 | ⚠️ High | Requires edge function audit first |
| **Phase 6** | MOB-708 | Low | Requires frontend query updates |

---

## Migration Naming Convention

All migrations follow `YYYYMMDDHHMMSS_description.sql` per `docs/conventions/MIGRATION_PROTOCOL.md`.

Each migration file must include:
```sql
-- Consumers: <list of affected src/ files>
-- Impact: <description of changes and breakage risk>
```

---

## Verification Protocol

After each phase:
1. `npm run build` — confirm zero type errors
2. Test affected user flows (admin, host, renter)
3. Verify RLS with `supabase--read_query` for each affected table
4. Check edge function logs for auth failures
