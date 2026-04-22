# MobiRides Bug Report

**Last Updated:** April 17, 2026  
**Reference:** Week 3 April Status Report, Sprint 11 Execution Plan, [Tapologo Testing Sheet](/workspace/Tapologo_Testing Sheet.xlsx)

---

## 📊 Tapologo QA Testing Results (April 2026)

An independent QA verification was conducted by **Tapologo** in April 2026 using a comprehensive 197-test-case spreadsheet covering all functional areas.

### Test Results Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 197 |
| Passed | 119 |
| Failed | 0 |
| Blocked | 0 |
| Execution Rate | 72.1% |

### Key Findings

1. **Zero functional bugs identified** — All executed tests passed, indicating core functionality is working
2. **Handover Process achieved 100% execution** — All 15 test cases passed
3. **Execution rate of 72.1%** — Higher than the internal team's ~62% average
4. **Coverage gaps identified** — Admin Dashboard (20 tests) and Reviews & Ratings (8 tests) not executed

### In Progress Tests (24 tests)

These tests were started but not completed during the testing session:

| Module | Test Cases |
|--------|-----------|
| Authentication & Profile | Signup, Logout, Session persistence, Profile view/edit, Avatar upload |
| Verification (KYC) | Phone verification step |
| Vehicle Management | Car creation Step 2, Edit car, Delete image, Block dates |
| Booking System | Date conflict, Price breakdown, Pickup location |
| Payment & Wallet | Commission display, Earnings breakdown, Top-up |
| Navigation & Maps | Off-route detection, Traffic layer |
| Notifications | Notification preferences |

### Coverage Gaps (54 tests not run)

| Module | Tests Not Run | Priority |
|--------|---------------|-----------|
| Admin Dashboard | 20 | High — Admin functionality untested |
| Reviews & Ratings | 8 | High — User feedback loop untested |
| Promo Codes | 6 | Medium — Discount system untested |
| Verification (KYC) | 4 | Low — Admin verification tests |
| Vehicle Management | 3 | Low |
| Booking System | 5 | Low |
| Messaging | 2 | Low |
| Insurance System | 5 | Low |

### Action Items from Tapologo Testing

1. **Complete In Progress tests** — Finish the 24 started tests
2. **Execute Not Run tests** — Especially Admin Dashboard and Reviews
3. **Add unit test coverage** — Vehicle Management, Reviews & Ratings, Promo Codes (added to Sprint 12 as S12-026/027/028)

> **Reference:** [Testing Coverage Status Report](./TESTING_COVERAGE_STATUS_2026_03_02.md) — Updated April 17, 2026 with Tapologo results

---

## Active Bugs

### BUG-002: Security Vulnerabilities — MOB-700 Series

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-04 |
| **Severity** | Critical / High / Medium / Low (9 findings) |
| **Status** | 🟡 In Progress (5/9 shipped) |
| **Affects** | Edge functions, password storage, author emails |
| **Plan** | [`docs/hotfixes/SECURITY_REMEDIATION_2026_04_04.md`](../hotfixes/SECURITY_REMEDIATION_2026_04_04.md) |

**Description:**  
Security scan identified 9 actionable findings. Sprint 10–11 shipped 5 of 9:

| Ticket | Finding | Status |
|--------|---------|--------|
| MOB-701 | Hardcoded secrets in scripts | ✅ Done (Sprint 10) |
| MOB-702 | Unauthenticated `add-admin` endpoint | ✅ Done (Sprint 11) |
| MOB-703 | Blanket notification access RLS | ✅ Done (Sprint 11) |
| MOB-704 | Missing RLS on financial tables | ✅ Done (Sprint 11) |
| MOB-706 | Mutable `search_path` on functions | ✅ Done (Sprint 11) |
| MOB-705 | No input validation on edge functions | 🔴 Open — Sprint 12 (S12-006) |
| MOB-707 | Plaintext/weak password storage | 🔴 Open — Sprint 12 (S12-007) |
| MOB-708 | Exposed author emails | 🔴 Open — Sprint 12 (S12-008) |
| MOB-709 | Missing leaked-password protection | 🔴 Open — Sprint 12 (S12-009) |

**Target:** 100% remediation by end of Sprint 12 (May exit criterion).

---

### BUG-006: Supabase Strict Type (`RejectExcessProperties`) Build Errors

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-07 |
| **Severity** | Medium (blocks strict build) |
| **Status** | 🔴 Open |
| **Affects** | `AdminClaimsDashboard.tsx`, `AddressSection.tsx`, `EmergencyContactSection.tsx`, `PersonalInfoSection.tsx`, `HostBookings.tsx`, `enhancedHandoverService.ts`, `handoverService.ts` |
| **Assigned To** | Tapologo |
| **Sprint 12** | S12-025 |

**Description:**  
9 build errors across 7 files caused by: (1) UI alias properties passed to DB operations, (2) non-existent `user_role` property in `user_verifications` inserts, (3) dynamic computed keys producing index-signature types incompatible with strict column typing.

**Remediation Plan:**
1. Map alias fields to real DB column names in `AdminClaimsDashboard.tsx`
2. Remove `user_role` from `.insert()` calls in verification sections
3. Replace dynamic keys with explicit typed assignments
4. No `as any` casts — use Supabase generated types

---

### BUG-008: Email Notification System — Phase 4 Outstanding (MOB-811)

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-10 |
| **Severity** | Medium |
| **Status** | 🟡 Partially Resolved |
| **Affects** | `supabase/functions/resend-service/index.ts`, `src/services/notificationService.ts` |
| **Assigned To** | Modisa |
| **Sprint 12** | S12-012 |

**Description:**  
Sprint 11 successfully restored 18/20 email templates (Phases 1–3 of MOB-712). Remaining work: Phase 4 — Admin Bulk Notification Broadcast system (MOB-811), including system notification template, admin broadcast form, and rate limiting.

---

### BUG-009: Phased Build Action Failure (Gradle Initialization Script)

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-11 |
| **Severity** | Low (IDE-specific, not blocking builds) |
| **Status** | 🟡 Workaround Applied |
| **Affects** | `android/build.gradle`, Java Language Server |
| **Plan** | [`docs/plans/20260411_BUG009_GRADLE_BUILD_FIX.md`](../plans/20260411_BUG009_GRADLE_BUILD_FIX.md) |

**Description:**  
IDE Gradle initialization script path mismatch in RedHat Java extension. Sprint 11 resolved the actual build environment; the IDE cache issue is a cosmetic annoyance with a documented workaround (clear `workspaceStorage`). `app:assembleDebug` verified working via script.

**Ticket:** MOB-6

---

### BUG-010: Persistent Data Integrity Issues (Orphaned Users/Profiles)

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | High (Revenue/User Block) |
| **Status** | 🔴 Open |
| **Affects** | `auth.users`, `public.profiles` |
| **Linear** | ❌ No ticket — to be created Sprint 12 (S12-017) |

**Description:**  
323 auth users vs 247 profiles = **76 orphaned users**. The `handle_new_user` trigger is failing to catch all signups. Requires profile backfill and trigger audit.

---

### BUG-011: Missing SuperAdmin Core Logic Functions

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | Medium |
| **Status** | 🟡 Partially Addressed |
| **Affects** | SuperAdmin Portal, PostgreSQL RPCs |
| **Linear** | ❌ No ticket — to be created Sprint 12 (S12-018) |

**Description:**  
Sprint 11 delivered `suspend_user` and `ban_user` RPCs (MOB-21, verified by Arnold). Still missing: `transfer_vehicle`, `remove_restriction`, and `log_admin_action` functions.

---

### BUG-012: Payment System Mock Implementation in Production

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | Critical (blocks revenue) |
| **Status** | 🔴 Open |
| **Affects** | `useBookingPayment.ts`, `mockBookingPaymentService.ts`, `useHostPayouts.ts`, `BookingRequestDetails.tsx` |
| **Linear** | MOB-22 |
| **Sprint 12** | S12-001 through S12-005 (Phase 0 fixes) |

**Description:**  
The application uses `mockBookingPaymentService` with `setTimeout` simulations for all payment flows. The [Payment Production Readiness Plan](../plans/20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) documents 5 critical mock-flow bugs:

1. **Double commission** — Host approval deducts 15% commission before renter pays; webhook would also deduct.
2. **Webhook bypass** — Mock flow calls `bookingLifecycle.updateStatus('confirmed')` directly, skipping the webhook entirely.
3. **No transaction records** — No `payment_transaction` DB records created; `credit_pending_earnings()` never called.
4. **Mock payout** — `useHostPayouts.ts` returns fake API responses with `setTimeout(2000)`.
5. **No refund path** — Cancellation has no refund flow.

Sprint 12 targets Phase 0 (fix mock-flow bugs). Phase 1 (real provider integration) deferred to Sprint 13+ pending DPO/Ooze credentials.

---

### BUG-013: Security Search Path Management

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | High |
| **Status** | 🟡 Partially Resolved |
| **Affects** | SQL functions, `conversations` table RLS |
| **Linear** | MOB-23 (In Progress — status needs update) |

**Description:**  
Sprint 11 shipped MOB-706 (S11-011) which applied `SET search_path = public` to all `SECURITY DEFINER` functions. The residual item is that `conversations` table RLS is reportedly still disabled for "testing" in production — this needs verification and re-enablement.

---

### BUG-014: Persistent Migration Drift (http_request types)

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | Critical (Blocks `db pull` & CI/CD) |
| **Status** | 🔴 Open |
| **Affects** | `supabase/migrations/20260319212624_remote_schema.sql`, `20260410143004_remote_schema.sql` |
| **Linear** | ❌ No ticket — to be created Sprint 12 (S12-019) |

**Description:**  
Migration `20260319212624` contains manual `CREATE TYPE` blocks for `http_*` types that should be extension-owned. The CLI generates corrective `DROP TYPE` statements that fail during Shadow DB sync (`SQLSTATE 2BP01`).

**Resolution Strategy:**
1. Comment out `CREATE TYPE` blocks in `20260319212624`
2. Delete `DROP TYPE` blocks in `20260410143004`
3. Add explicit `CREATE EXTENSION IF NOT EXISTS "http"` migration

---

### FEATURE-001: Missing Detailed Views on Admin Tables (MOB-711)

| Field | Detail |
|-------|--------|
| **Date Requested** | 2026-04-07 |
| **Severity** | Low (Enhancement) |
| **Status** | 🔴 Open |
| **Affects** | 6 Admin Management tables |
| **Plan** | [`docs/plans/20260407_MOB711_ADMIN_DETAILED_VIEWS_IMPLEMENTATION.md`](../plans/20260407_MOB711_ADMIN_DETAILED_VIEWS_IMPLEMENTATION.md) |

**Description:**  
Admin Portal lacks explicit "View Details" `<Eye />` action icons on complex tables. Implementation plan exists for read-only detail dialogs.

**Ticket:** S10-025 / MOB-711

---

### FEATURE-002: Consolidate Admin User Management Components

| Field | Detail |
|-------|--------|
| **Date Requested** | 2026-04-12 |
| **Severity** | Low (Internal refactoring) |
| **Status** | 🔴 Open |
| **Affects** | `UnifiedUserTable`, `UserManagementTable`, `AdvancedUserManagement` |

**Description:**  
Three redundant user table implementations exist. Refactor to single unified component supporting different display modes.

---

## Resolved Bugs

| ID | Resolution Date | Summary |
|----|----------------|---------|
| **BUG-001** | 2026-03-28 | `create_handover_notification` return type conflict — dropped legacy function overload. |
| **BUG-003** | 2026-04-14 | `notification_type` enum dependency error — MOB-801/802 shipped (S11-005/S11-006). |
| **BUG-004** | 2026-04-06 | Outbound SSRF via `send-push-notification` — SSRF whitelist deployed, keys rotated. |
| **BUG-005** | 2026-04-06 | Excessive unauthenticated query spam — 85% request reduction (309→50-80 req/min). |
| **BUG-007** | 2026-04-10 | Admin table data inaccuracies — 10 tables standardized with accurate pagination/exports. |

---

## Roadmap Audit Status (MOB-210..MOB-225)

| ID | Issue | Status |
|---|---|---|
| **MOB-210** | Signup flow broken | 🟡 Re-Opened as **BUG-010** (76 orphaned users) |
| **MOB-211-225** | Handover, Payment, Notifications, Map, Claims | ✅ All Resolved |

---

*Updated by: Modisa Maphanyane — April 17, 2026*
