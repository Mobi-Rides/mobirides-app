# MobiRides Bug Report

**Last Updated:** May 8, 2026  
**Reference:** Week 2 May Status Report, Sprint 13 Execution Plan, [Tapologo Testing Sheet](/workspace/Tapologo_Testing Sheet.xlsx)

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
| MOB-705 | No input validation on edge functions | ✅ Done (Sprint 12) |
| MOB-707 | Plaintext/weak password storage | ✅ Done (Sprint 12) |
| MOB-708 | Exposed author emails | 🔴 Open — Sprint 13 (S13-006) (Requires backend branching) |
| MOB-709 | Missing leaked-password protection | ✅ Done (Sprint 12) |

**Target:** 100% remediation by end of Sprint 13 (May exit criterion).

---

### BUG-006: Supabase Strict Type (`RejectExcessProperties`) Build Errors

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-07 |
| **Severity** | Medium (blocks strict build) |
| **Status** | ✅ Resolved (Sprint 12) |
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
| **Status** | ✅ Resolved (Sprint 12) |
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
| **Status** | ✅ Resolved (Sprint 12) |
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
| **Status** | ✅ Resolved (Sprint 12) |
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

| **Sprint 12** | S12-001 through S12-005 (Phase 0 fixes) |

**Description:**  
The application uses `mockBookingPaymentService` with `setTimeout` simulations for all payment flows. The [Payment Production Readiness Plan](../plans/20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) documents 5 critical mock-flow bugs:

1. **Double commission** — Host approval deducts 15% commission before renter pays; webhook would also deduct.
2. **Webhook bypass** — Mock flow calls `bookingLifecycle.updateStatus('confirmed')` directly, skipping the webhook entirely.
3. **No transaction records** — No `payment_transaction` DB records created; `credit_pending_earnings()` never called.
4. **Mock payout** — `useHostPayouts.ts` returns fake API responses with `setTimeout(2000)`.
5. **No refund path** — Cancellation has no refund flow.

**Resolution (Sprint 13):** Phase 0 fixes implemented. Double commission logic removed, and mock service now generates valid internal transactions for testing. Phase 1 (real provider) pending credentials.

---

### BUG-019: Orphaned Booking Route Technical Debt

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-28 |
| **Severity** | Medium |
| **Status** | ✅ Resolved (Sprint 13) |
| **Affects** | `App.tsx`, `BookingDetails.tsx`, `NotificationDetails.tsx` |
| **Plan** | [`docs/plans/20260428_ROUTE_CONSOLIDATION_PLAN.md`](../plans/20260428_ROUTE_CONSOLIDATION_PLAN.md) |

---

### BUG-020: Invalid "Approved" Status Check in Renter UI

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-28 |
| **Severity** | Medium |
| **Status** | ✅ Resolved (Sprint 13) |
| **Affects** | `RenterBookingCard.tsx` |
| **Description** | Hardcoded check for `status === "approved"` which does not exist in the `BookingStatus` enum. Fixed during route consolidation. |

---

### BUG-021: Clumsy Map & Navigation Architecture

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-28 |
| **Severity** | High |
| **Status** | ✅ Resolved (Sprint 13) |
| **Affects** | `CustomMapbox.tsx`, `NavigationService.ts`, `MapMarkers.tsx` |
| **Plan** | [`docs/plans/20260428_MAP_NAVIGATION_REMEDIATION_PLAN.md`](../plans/20260428_MAP_NAVIGATION_REMEDIATION_PLAN.md) |

---

### BUG-013: Security Search Path Management

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-12 |
| **Severity** | High |
| **Status** | ✅ Resolved (Sprint 12) |
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
| **Status** | ✅ Resolved (Sprint 12) |
| **Affects** | `supabase/migrations/20260319212624_remote_schema.sql`, `20260410143004_remote_schema.sql` |
| **Linear** | MOB-63 (In Review) |

**Description:**  
Migration `20260319212624` contains manual `CREATE TYPE` blocks for `http_*` types that should be extension-owned. The CLI generates corrective `DROP TYPE` statements that fail during Shadow DB sync (`SQLSTATE 2BP01`).

**Resolution Strategy:**
1. Comment out `CREATE TYPE` blocks in `20260319212624`
2. Delete `DROP TYPE` blocks in `20260410143004`
3. Add explicit `CREATE EXTENSION IF NOT EXISTS "http"` migration

---

### BUG-015: Admin Analytics Dashboard — Empty Chart Data

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-22 |
| **Severity** | Medium (Reporting broken) |
| **Status** | 🔴 Open |
| **Affects** | `SuperAdminAnalytics.tsx`, `useSuperAdminAnalytics.ts`, `analyticsService.ts` |
| **Plan** | [`docs/plans/20260422_BUG015_016_ADMIN_ANALYTICS_EXPORT_FIX.md`](../plans/20260422_BUG015_016_ADMIN_ANALYTICS_EXPORT_FIX.md) |

**Description:**  
The "User Growth Trend" and "Booking Trends" charts on the Super Admin Analytics Overview tab render as empty. Root cause: `MobileOptimizedChart` components are hardcoded with `data={[]}` (lines 472 & 480 of `SuperAdminAnalytics.tsx`). The `getUserGrowthData()` method in `useSuperAdminAnalytics.ts` returns an empty array with a TODO comment. No service methods exist in `analyticsService.ts` to aggregate user registrations or bookings by month.

**Database Context:**
- 317 total profiles (295 renters, 20 hosts, 2 super_admin)
- 37 test/dummy accounts (filterable by `full_name`)
- 278 real users after filtering
- 163 bookings available for trend aggregation

---

### BUG-016: CSV Export — "Export Selected" Exports Only User IDs

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-22 |
| **Severity** | Medium (Blocks audit workflows) |
| **Status** | 🔴 Open |
| **Affects** | `BulkActionBar.tsx`, `UnifiedUserTable.tsx` |
| **Plan** | [`docs/plans/20260422_BUG015_016_ADMIN_ANALYTICS_EXPORT_FIX.md`](../plans/20260422_BUG015_016_ADMIN_ANALYTICS_EXPORT_FIX.md) |

**Description:**  
The "Export Selected" button in the `BulkActionBar` (line 200–217) only exports a single `user_id` column per selected user, making the CSV output useless for database auditing. It should export full user records (name, email, role, KYC status, account status, vehicles, bookings, joined date) — the same columns as the "Export CSV" button in `UnifiedUserTable`. Additionally, the `UnifiedUserTable` "Export CSV" button uses `filteredUsers` (all rows in memory), which is correct but needs browser verification to confirm the user isn't seeing a stale cached version.

---

### BUG-017: Admin Security Privilege Escalation Risk

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-27 |
| **Severity** | Critical |
| **Status** | ✅ Resolved |
| **Affects** | `AdminPromoCodes.tsx`, `AdminSecurity.tsx` |
| **Resolution** | Migrated all role checks to the canonical `user_roles` table in Supabase. |

---

### BUG-018: Admin Promo Codes Schema Mismatch

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-04-27 |
| **Severity** | High |
| **Status** | ✅ Resolved |
| **Affects** | `AdminPromoCodes.tsx` |
| **Resolution** | Aligned `host_id` -> `created_by` and handled missing `promo_code_cars` table with FUTURE comments. |

---


---

### BUG-022: Bulk Delete Admin Access Failure

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-05 |
| **Severity** | High |
| **Status** | ✅ Resolved |
| **Affects** | `bulk-delete-users` Edge Function |
| **Resolution** | Migrated admin access checks in `bulk-delete-users` to use `profiles.role` and the `is_admin` RPC, aligning it with the working pattern established in the `delete-user-with-transfer` function. |

---

### BUG-023: Navigation Service TypeScript 'any' Lint Errors

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-05 |
| **Severity** | Low (Lint/Type Safety) |
| **Status** | ✅ Resolved |
| **Affects** | `navigationService.ts` |
| **Resolution** | Removed unexpected `any` types by implementing `NavigationState` and `MapboxStep` interfaces and applying correct explicit types to ensure strict typing. |

---

### BUG-024: Handover System Fast Refresh & Type Safety

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-05 |
| **Severity** | Medium (Build Warnings / Type Safety) |
| **Status** | ✅ Resolved |
| **Affects** | `HandoverContext.tsx`, `EnhancedHandoverSheet.tsx` |
| **Resolution** | Decoupled the context object from the provider into separate files to satisfy Fast Refresh requirements and replaced all `any` casts with strict types (`HandoverStepCompletion`, `Record<string, unknown>`). |

---

### BUG-025: Mapbox Navigation Hook Type Safety

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-06 |
| **Severity** | Low (Type Safety) |
| **Status** | ✅ Resolved |
| **Affects** | `useMapboxNavigation.ts` |
| **Resolution** | Replaced `any` types with proper `NavigationStep` and `NavigationState` interfaces from the navigation service and strictly typed the Mapbox API response. |

---

### BUG-026: Wallet Access Restriction Error

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-07 |
| **Severity** | High |
| **Status** | ✅ Resolved |
| **Affects** | `walletService.ts`, `HostWallet.tsx` |
| **Resolution** | Fixed incorrect permission check in `getWalletBalance` that was blocking legitimate hosts from viewing their earnings. |

---

### BUG-029: 404 Error on Notification Action Links

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-07 |
| **Severity** | High |
| **Status** | ✅ Resolved |
| **Affects** | `resend-service/index.ts` |
| **Resolution** | Updated hardcoded `localhost:3000` URLs to `app.mobirides.com` and corrected relative pathing for deep links. |

---

### BUG-030: Rolldown OOM Build Panic

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-07 |
| **Severity** | Critical |
| **Status** | ✅ Resolved |
| **Affects** | `package.json`, Vercel Deployment |
| **Resolution** | Increased Node.js heap limit to 8GB (`--max-old-space-size=8192`) and disabled parallel minification to stabilize production builds. |

---

### BUG-031: Missing Mapbox GL Type Definitions

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-07 |
| **Severity** | Low |
| **Status** | ✅ Resolved |
| **Affects** | `src/types/mapbox.d.ts` |
| **Resolution** | Manually added missing `MapboxEvent` and `Layer` type definitions to satisfy strict TypeScript build requirements. |

---

### BUG-032: Verification Document Uploads Fail After Storage Policy Cleanup

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-11 |
| **Severity** | High (Blocks KYC verification) |
| **Status** | 🔴 Open |
| **Affects** | `verification-documents`, `verification-selfies`, verification upload flow |
| **Visible Result** | Users see failed verification document upload errors when submitting ID/selfie documents. |

**Description:**  
The verification flow uploads national ID images/PDFs to `verification-documents` and selfie photos to `verification-selfies`. Current migration scan shows those buckets were created historically, but latest remote-schema storage policies only preserve admin read access for verification buckets. Normal authenticated users may be blocked by storage RLS during insert/update.

**Likely Cause:**  
Security/storage cleanup removed or failed to preserve authenticated user `INSERT` / `UPDATE` / own-file `SELECT` policies for verification buckets.

**Verification:**  
Source confirmed in `src/services/verificationService.ts`; latest remote-schema migration policy block only shows admin read for verification storage. Fix candidate exists in `supabase/migrations/20260511083000_restore_verification_storage_user_policies.sql`.

---

### BUG-033: Vehicle Document Upload Uses Bucket With No Confirmed Creation Migration

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-11 |
| **Severity** | High (Can block host vehicle listing documents) |
| **Status** | 🔴 Open |
| **Affects** | `car-documents`, `/add-car`, vehicle document upload |
| **Visible Result** | Vehicle document uploads can fail if the `car-documents` bucket is missing online. |

**Description:**  
`AddCar.tsx` uploads vehicle documents to `car-documents`, but migration scan did not find a committed active migration that creates this bucket before the local storage repair migration. If the online Supabase project does not already contain the bucket, uploads will fail with bucket-not-found/storage errors.

**Likely Cause:**  
The application introduced `car-documents` usage without a matching durable storage bucket migration, or a later schema/security sync omitted it.

**Verification:**  
Source confirmed in `src/pages/AddCar.tsx`. No active pre-repair migration was found creating `car-documents`.

---

### BUG-034: Chat Attachment Bucket Name Mismatch

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-11 |
| **Severity** | High (Can break chat file attachments) |
| **Status** | 🔴 Open |
| **Affects** | `chat-attachments`, `message-attachments`, chat attachment upload |
| **Visible Result** | Users may be unable to upload or view chat attachments. |

**Description:**  
The chat UI uploads files to `chat-attachments`, while latest remote-schema storage policies reference `message-attachments`. Older migrations mention `chat-attachments`, but the current schema snapshot favors `message-attachments`, creating a bucket/policy mismatch.

**Likely Cause:**  
Storage bucket naming drift between chat implementation and later remote schema/security migrations.

**Verification:**  
Source confirmed in `src/components/chat/MessageInput.tsx`; latest remote-schema policy blocks reference `message-attachments`.

---

### BUG-035: Handover Photo Bucket Is Not Clearly Present in Active Migrations

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-11 |
| **Severity** | High (Can block handover photo documentation) |
| **Status** | 🔴 Open |
| **Affects** | `handover-photos`, enhanced handover photo uploads |
| **Visible Result** | Handover step photo uploads may fail with missing bucket or storage policy errors. |

**Description:**  
The handover service uploads photos to `handover-photos`, but the bucket creation found during scan appears in archived duplicate-timestamp migrations rather than clearly active latest migrations. Latest remote-schema storage policy snippets do not clearly preserve handover photo policies.

**Likely Cause:**  
Handover storage setup may have been archived or omitted during migration cleanup / remote schema sync.

**Verification:**  
Source confirmed in `src/services/enhancedHandoverService.ts`; active migration scan did not find a clear current bucket creation/policy restoration path.

---

### BUG-036: Storage Policy Regression Risk Across Public Upload Buckets

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-11 |
| **Severity** | High (Multiple upload workflows can fail) |
| **Status** | 🔴 Open |
| **Affects** | `avatars`, `car-images`, `insurance-claims`, `return-photos`, public upload/read flows |
| **Visible Result** | Profile avatars, car images, insurance claim evidence, or return photos may fail to upload or display depending on online bucket/policy state. |

**Description:**  
Several app features depend on Supabase Storage buckets and public/authenticated policies. Historical migrations create or configure these buckets, but latest remote-schema storage policy blocks only show a subset of policies, especially for `car-images`, `insurance-claims`, `message-attachments`, and verification buckets. This creates a regression risk after security hardening or remote schema sync.

**Likely Cause:**  
Security hardening and remote-schema migrations preserved some storage policies but not the full set of user-facing upload/read policies required by current frontend flows.

**Verification:**  
Read-only scan compared `supabase.storage.from(...)` usage against storage bucket/policy migrations. Broad repair candidate exists in `supabase/migrations/20260511090000_repair_app_storage_buckets_and_policies.sql`.

---

### FEATURE-001: Missing Detailed Views on Admin Tables (MOB-711)

| Field | Detail |
|-------|--------|
| **Date Requested** | 2026-04-07 |
| **Severity** | Low (Enhancement) |
| **Status** | ✅ Resolved (Sprint 12) |
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
| **Status** | ✅ Resolved (Sprint 12) |
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
| **BUG-010** | 2026-04-28 | 76 orphaned users / auth vs profile drift — Backfilled & triggers audited. |
| **BUG-013** | 2026-04-28 | Security Search Path Management — Universal enforcement on all functions. |
| **BUG-014** | 2026-04-28 | Persistent Migration Drift — Cleaned up http extension conflicts. |
| **BUG-017** | 2026-04-28 | Admin Security Privilege Escalation Risk — Migrated to `user_roles`. |
| **BUG-018** | 2026-04-28 | Admin Promo Codes Schema Mismatch — Fixed `created_by` mapping. |
| **BUG-022** | 2026-05-05 | Bulk Delete Admin Access Failure — Fixed edge function to use `profiles.role` and `is_admin` RPC. |
| **BUG-023** | 2026-05-05 | Navigation Service TypeScript 'any' Lint Errors — Replaced `any` with strict typing. |
| **BUG-024** | 2026-05-06 | Handover System Fast Refresh & Type Safety — Decoupled context from provider and fixed any casts. |
| **BUG-025** | 2026-05-06 | Mapbox Navigation Hook Type Safety — Hardened types for Mapbox API response. |
| **BUG-026** | 2026-05-08 | Wallet access restriction fix — Corrected permission logic in wallet service. |
| **BUG-029** | 2026-05-08 | 404 on notification links — Switched to production absolute URLs. |
| **BUG-030** | 2026-05-08 | Rolldown OOM Build Panic — Increased heap memory allocation. |
| **BUG-031** | 2026-05-08 | Missing Mapbox GL types — Added custom declaration file. |
| **BUG-012** | 2026-05-08 | Payment System Mock Phase 0 — Internal transactions and double-commission fixed. |
| **BUG-019** | 2026-05-08 | Orphaned Booking Route — Consolidated routes into `/rental-details/:id`. |
| **BUG-021** | 2026-05-08 | Clumsy Map Architecture — Extracted modular hooks and bottom sheets. |

---

## Roadmap Audit Status (MOB-210..MOB-225)

| ID | Issue | Status |
|---|---|---|
| **MOB-210** | Signup flow broken | 🟡 Re-Opened as **BUG-010** (76 orphaned users) |
| **MOB-211-225** | Handover, Payment, Notifications, Map, Claims | ✅ All Resolved |

---

*Updated by: Codex storage audit — May 11, 2026*
