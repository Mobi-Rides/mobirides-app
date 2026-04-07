# MobiRides Bug Report

## Active Bugs

### BUG-002: Security Vulnerabilities — MOB-700 Series

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-04 |
| **Severity** | Critical / High / Medium / Low (9 findings) |
| **Status** | 🟡 In Progress |
| **Affects** | RLS policies, edge functions, credentials, password storage |
| **Plan** | [`docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md`](./hotfixes/SECURITY_REMEDIATION_2026_04_04.md) |

**Description:**  
Security scan identified 9 actionable findings: hardcoded secrets in scripts, unauthenticated admin creation endpoint, blanket notification access, missing RLS on financial tables, no input validation on edge functions, mutable search_path on 11 functions, plaintext password storage, exposed author emails, and missing leaked-password protection.

**Tickets:** MOB-701 through MOB-709. See linked plan for full breakdown with acceptance criteria, consumer searches, migration SQL, and phased execution order.

---

### BUG-003: `notification_type__old_version_to_be_dropped` Dependency Error

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-04 |
| **Severity** | Critical (blocks `supabase db pull`) |
| **Status** | 🔴 Open |
| **Affects** | Shadow DB replay — `20260319212624_remote_schema.sql`, `20260328135949_remote_schema.sql` |
| **Plan** | [`docs/hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md`](./hotfixes/HOTFIX_DB_PULL_NOTIFICATION_TYPE_2026_04_04.md) |

**Description:**  
`supabase db pull` fails with `SQLSTATE 2BP01` — 7 functions still reference the old `notification_type` enum via their parameter signatures, blocking the `DROP TYPE` statement. A redundant enum rename block in the second `remote_schema.sql` compounds the issue.

**Tickets:** MOB-801, MOB-802. See linked plan for SQL fixes, impact assessment, and execution order.

---

### BUG-004: Outbound SSRF Traffic via `send-push-notification`

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-06 |
| **Severity** | Critical |
| **Status** | ✅ Resolved |
| **Affects** | `supabase/functions/send-push-notification/index.ts`, `.env`, 16 scripts with hardcoded keys |
| **Reported By** | Supabase Security (Matthias Luft) |

**Description:**  
Supabase Security flagged suspicious outbound scanning traffic to `vip.66591.vip/.env.test` originating from the application. Root cause: attacker used the previously leaked `service_role` key to invoke the `send-push-notification` edge function with a malicious `subscription.endpoint`, triggering SSRF to scan external targets for environment files.

**Fix Applied:**
1. Deleted 16 scripts containing hardcoded `service_role` and `anon` keys (9 on Apr 5, 7 on Apr 6)
2. Removed `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN` from `.env`
3. Added SSRF domain whitelist to `send-push-notification/index.ts` — only `fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.notify.windows.com`, `*.wns.windows.com`, `web.push.apple.com` allowed
4. Full API and JWT Key Rotation (2026-04-07): Upgraded JWT Signing Keys to ECC P-256 and explicitly revoked compromised Legacy HS256 JWT Secret to invalidate active attacker sessions. Rotated publishable and secret API keys in local and production hosting environments.

**Redeployment Verified:**
Edge function force-redeployed to Supabase runtime. Test request to `https://evil.example.com/.env` returned `403 — Push endpoint domain not allowed`. Log entry confirmed: `Blocked push to disallowed endpoint: https://evil.example.com/.env`. SSRF whitelist is **live in production**.

**Tickets:** MOB-710 (SSRF endpoint validation), MOB-701 (hardcoded secrets — now in progress).

---

### BUG-005: Excessive Unauthenticated Query Spam & Redundant Polling

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-06 |
| **Severity** | Medium |
| **Status** | ✅ Resolved |
| **Affects** | `Navigation.tsx`, `RenterStats.tsx`, `HostStats.tsx`, `Wallet.tsx`, `AuditLogViewer.tsx`, `MessagingInterface.tsx`, + 6 more |

**Description:**  
With a single authenticated user, the app generated ~309 requests/minute to Supabase due to: (1) `useQuery` hooks firing without `enabled: !!user` guards — causing 401 errors on the login page, (2) redundant `supabase.auth.getUser()` network calls inside every `queryFn` instead of using cached `useAuth().user`, (3) aggressive polling intervals (5s–30s) duplicating data already covered by realtime subscriptions, and (4) missing `staleTime` causing refetches on every mount/focus.

**Fix Applied (2026-04-06):**
1. Added `enabled: !!user` guards to all queries requiring authentication — eliminates 401 spam on login page
2. Replaced inline `supabase.auth.getUser()` calls with cached `useAuth().user` in high-traffic components (Navigation, RenterStats, HostStats, MessagingInterface)
3. Reduced polling intervals: notifications 5s→60s, messages 10s→60s, stats 30s→120s, audit logs 30s→60s
4. Added `staleTime` (10s–120s) to prevent unnecessary refetches on mount/focus
5. Removed duplicate realtime subscription in `NotificationsSection.tsx`
6. Removed redundant notification count polling in `Header.tsx`

**Impact:** ~309 req/min → ~50-80 req/min (85% reduction). Auth requests reduced from ~26/min to ~2/min.

**Ticket:** S10-023 (query optimization).

---

### BUG-006: Supabase Strict Type (`RejectExcessProperties`) Build Errors

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-07 |
| **Severity** | Medium (blocks build) |
| **Status** | 🔴 Open |
| **Affects** | `AdminClaimsDashboard.tsx`, `AddressSection.tsx`, `EmergencyContactSection.tsx`, `PersonalInfoSection.tsx`, `HostBookings.tsx`, `enhancedHandoverService.ts`, `handoverService.ts` |
| **Assigned To** | Tapologo |

**Description:**  
Supabase's updated TypeScript client enforces `RejectExcessProperties` on `.update()` and `.insert()` calls. 9 build errors across 7 files caused by three patterns: (1) UI alias properties (`estimated_repair_cost`, `renter`, `supporting_documents`) passed to DB operations that don't match schema columns, (2) non-existent `user_role` property included in `user_verifications` inserts, (3) dynamic computed keys (`{ [field]: value }`) producing index-signature types incompatible with strict column typing.

**Remediation Plan:**
1. **Map alias fields** — In `AdminClaimsDashboard.tsx`, build update objects using real DB column names (`estimated_damage_cost`, `location`, `excess_amount_due`, `evidence_urls`) instead of UI aliases
2. **Remove `user_role`** — Delete `user_role: profile.role` from `.insert()` calls in `AddressSection.tsx`, `EmergencyContactSection.tsx`, `PersonalInfoSection.tsx` (column doesn't exist on `user_verifications`)
3. **Replace dynamic keys** — Use explicit conditional assignments typed with `Tables<'table_name'>['Update']` instead of `{ [field]: value }` in `PersonalInfoSection.tsx`, `HostBookings.tsx`, `handoverService.ts`, `enhancedHandoverService.ts`
4. **No `as any` casts** — All fixes use Supabase's generated types for proper type alignment

**Ticket:** S10-024

---

## Resolved Bugs

### BUG-001 — `create_handover_notification` Return Type Conflict
Resolved 2026-03-28. See `docs/hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md`.
