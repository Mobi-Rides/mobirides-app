# MobiRides Bug Report

**Last Updated:** May 8, 2026 (BUG-032–039 added)  
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

### BUG-032: Admin Vehicle Type Displaying Raw Enum Value

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (Display / UX) |
| **Status** | ✅ Resolved |
| **Affects** | `src/pages/admin/AdminCampaigns.tsx`, admin vehicle management views |
| **Branch** | `bathoensescob/bugfix-wallet-redirect-cartype-admin-dup` |

**Description:**  
The vehicle type field in admin-facing tables was displaying the raw database enum value (e.g., `sedan_4_door`) instead of a human-readable label. Caused by missing enum-to-label mapping in the admin display layer.

**Resolution:** Added a `vehicleTypeLabel` mapping function to convert DB enum values to display strings in the affected admin views.

---

### BUG-033: Admin User List Showing Duplicate Entries

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (Data Integrity / UX) |
| **Status** | ✅ Resolved |
| **Affects** | Admin user management list / `UnifiedUserTable` data fetch |
| **Branch** | `bathoensescob/bugfix-wallet-redirect-cartype-admin-dup` |

**Description:**  
The admin user list was showing duplicate rows for some users due to a join on `user_roles` returning multiple rows per user when a user holds more than one role. Each role row was producing a separate user entry.

**Resolution:** Deduplicated results by grouping/aggregating roles per user instead of producing a row per role. Users now appear once with all roles merged into a single entry.

---

### BUG-034: Host Booking Email Approve/Decline Links 404

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Blocks host approval workflow) |
| **Status** | ✅ Resolved |
| **Affects** | `supabase/functions/resend-service/index.ts`, `src/services/notificationService.ts` |
| **Branch** | `bathoensescob/bugfix-wallet-redirect-cartype-admin-dup` |

**Description:**  
When a host received a `owner-booking-notification` email and clicked the "Approve Request" or "Decline Request" buttons, the links resolved to a 404. Two separate root causes:

1. **Wrong fallback domain** — The fallback `href` values in the approve/decline buttons used `https://mobirides.com/host-bookings` (missing `app.` subdomain). Production routes require `https://app.mobirides.com/...`.
2. **Missing URL fields in service layer** — `notificationService.ts` was not populating `manage_url`, `approve_url`, `decline_url`, or `booking_url` fields when constructing the email template payload, causing the template to fall back to the static (wrong) defaults.

**Resolution:**
- Updated both approve and decline button fallback `href` values in `resend-service/index.ts` (owner-booking-notification template) to `https://app.mobirides.com/host-bookings`.
- Added `approve_url`, `decline_url`, `manage_url`, and `booking_url` to the template data payload in `notificationService.ts`, correctly derived from `bookingData.bookingId`.

**Related:** Merge conflict between `develop` and local stash was resolved; upstream changes from `develop` were kept for the domain fallback.

---

### BUG-035: Test Suite Regressions — 10 Failing Tests Across 7 Suites

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (CI / Code Quality) |
| **Status** | ✅ Resolved |
| **Affects** | Jest test suite (7 test files, 10 individual tests) |
| **Branch** | `bathoensescob/bugfix-wallet-redirect-cartype-admin-dup` |

**Description:**  
After merging `develop` into the bugfix branch, 10 tests failed across 7 test suites. Each had a distinct root cause:

| File | Root Cause | Fix Applied |
|------|-----------|-------------|
| `notificationRouting.test.ts` | `getEmailTemplateKey` returns hyphen-style keys (e.g., `'booking-cancelled'`) that were absent from `RESEND_TEMPLATES` | Added 12 hyphen-style alias keys to `ResendTemplateKey` type and `RESEND_TEMPLATES` object in `resend-templates.ts` |
| `bookingLifecycle.test.ts` | Tests asserted `pushNotificationService.sendBookingNotification` but the service was refactored to use `CompleteNotificationService` which no longer calls that method | Removed stale `sendBookingNotification` assertions; success/payment field assertions retained |
| `dynamicPricingCalculation.test.ts` (x2) | Mock `dbRule` used `name`/`type`/`conditions` but service reads `rule_name`/`condition_type`/`condition_value`; settings mock passed boolean `true` but service compares `=== "true"` | Fixed mock field names; changed `buildSettingsChain(true)` → `buildSettingsChain("true")` |
| `enhancedBookingService.test.ts` | Timezone mismatch: test used UTC fake time but service parsed booking start times as local time; on UTC+2 machines, 2h and 30min reminder windows evaluated to 0 min difference | Added `process.env.TZ = 'UTC'` to `jest.config.js` |
| `UnifiedUserTable.test.tsx` | Test clicked sort header once (producing descending order) but expected ascending order in export | Fixed test to click header twice (first = desc, second = asc) |
| `extensionRequestDialog.test.tsx` | Test queried UI by labels/text that didn't match actual component (`"Total Cost"` vs `"Additional cost"`, missing aria-labels, `"Submit"` vs `"Send Request"`); global supabase mock lacked `insert` method | Rewrote test to match component; added `insert` to `src/__mocks__/supabaseClient.ts`; added `async/waitFor` for submit test |
| `sprint10-arnold.test.ts` | `CarManagementTable` Eye icon opened a preview dialog instead of navigating to `/car/${car.id}` as the test required | Changed Eye button `onClick` from `setPreviewCar(car)` to `navigate(\`/car/${car.id}\`)` in `CarManagementTable.tsx` |

**Post-fix result:** 487 tests across 42 suites — all passing.

---

### BUG-036: SuperAdmin UserBehavior Dashboard — Geographic/Revenue/Engagement Tabs Showing Mock Data

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (Reporting broken — superadmin only) |
| **Status** | ✅ Resolved |
| **Affects** | `UserBehavior.tsx`, `useGeographicAnalytics.ts`, Supabase database |
| **Branch** | `bathoensescob/bugfix-wallet-redirect-cartype-admin-dup` |

**Description:**  
The Geographic, Revenue, and Engagement tabs on the SuperAdmin UserBehavior dashboard were backed by the `useGeographicAnalytics` hook but the three required Supabase RPCs did not exist in the database. All three tabs silently fell back to empty/zero states (the hook returns `[]` / `null` on error). The hook was already wired correctly in the component — the gap was entirely at the database layer.

**Root cause:** Migration `20260508000000_add_geographic_analytics_rpcs.sql` was present locally but had never been applied to the remote database.

**RPCs deployed:**

| Function | Returns |
|----------|---------|
| `get_geographic_revenue_stats()` | Top 10 locations by revenue — `location`, `unique_users`, `total_bookings`, `total_revenue` |
| `get_revenue_summary()` | Aggregate figures — `monthly_revenue`, `avg_booking_value`, `avg_revenue_per_user`, `total_bookings`, `total_users` |
| `get_engagement_metrics()` | Booking KPIs — `booking_conversion_rate`, `return_booking_rate`, `avg_bookings_per_user`, `total_users`, `users_with_bookings` |

All functions use `SECURITY DEFINER SET search_path = public` and grant `EXECUTE` to `authenticated` and `service_role`.

**Resolution:**  
Applied migration via `supabase db query --linked`, then registered it as applied with `supabase migration repair --status applied 20260508000000`. (Direct query approach was required because a remote-only orphaned migration `20260508083755` blocked `db push`.)

**Verification:**  
Test script (`_geo_analytics_test_tmp.mjs`) ran 20 checks — all passed:
- All 3 RPCs callable by authenticated user, correct column shapes, non-negative values
- `get_geographic_revenue_stats` returns 10 rows ordered by revenue DESC (live data)
- Revenue summary: P1,786.50 monthly revenue, P8,972.05 avg booking value
- Engagement: 322 total users, 10.2% booking conversion, 54.5% return booker rate
- `UserBehavior.tsx` source confirmed: no hardcoded city/revenue strings, hook and loading states wired correctly

---

### BUG-037: Admin Notification Monitoring — Canonical File Missing, Only "Fixed" Variant Existed

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (Code hygiene / naming hazard) |
| **Status** | ✅ Resolved |
| **Affects** | `src/components/admin/NotificationMonitoring.tsx`, `src/components/admin/NotificationMonitoringFixed.tsx`, `src/pages/admin/AdminCampaigns.tsx` |
| **Branch** | `bathoensescob/feat-superadmin-geographic-analytics` |

**Description:**  
The canonical `NotificationMonitoring.tsx` file did not exist; only `NotificationMonitoringFixed.tsx` (a parallel "patched" variant from a prior emergency fix) was present. `AdminCampaigns.tsx` imported the `Fixed` version directly. While the Monitoring tab worked, the codebase carried a confusing naming artifact and the canonical path was a dangling reference — any future code (or test) importing from `@/components/admin/NotificationMonitoring` would fail to resolve.

Initial reports indicated both files were 0-byte; investigation confirmed `NotificationMonitoringFixed.tsx` was fully implemented (223 lines) and `NotificationMonitoring.tsx` was simply absent. No orphaned admin sidebar links existed — all 17 sidebar entries already had matching routes.

**Resolution:**  
- Created canonical `src/components/admin/NotificationMonitoring.tsx` with the full delivery dashboard implementation (4 metric cards + per-campaign delivery table querying `notification_campaigns`)
- Updated `AdminCampaigns.tsx` to import `{ NotificationMonitoring }` from the canonical path
- Deleted the now-orphaned `NotificationMonitoringFixed.tsx`

**Verification:**  
3 Jest unit tests in `__tests__/notificationMonitoring.test.tsx`:
- Renders the empty-state when `notification_campaigns` is empty
- Aggregates Total Sent / Delivered / Failed / Rate correctly across `completed` campaigns; renders per-row dashes for rows without data
- Renders the "no failed campaigns" caption when all sends succeeded

All 3 passing.

---

### BUG-038: Navigation Realtime Channel Collision + Cleanup Leak

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Medium (Realtime degradation, channel leak) |
| **Status** | ✅ Resolved |
| **Affects** | `src/components/Navigation.tsx` |
| **Branch** | `bathoensescob/feat-superadmin-geographic-analytics` |

**Description:**  
Browser console emitted `Error: cannot add postgres_changes callbacks for realtime:navigation-updates after subscribe()` on every component remount (React strict mode in dev, hot reload in prod). Two compounding bugs in the unread-message-count realtime subscription:

1. **Hardcoded channel name** — `.channel('navigation-updates')` used a static string. On the second mount, Supabase already had a subscribed channel by that name, so the new `.on(...)` calls failed.
2. **Cleanup returned from inner async function, not from `useEffect`** — the `return () => supabase.removeChannel(channel)` was returned from the inner `setupRealtimeSubscription()` async function whose return value was then discarded by the `useEffect`. React had nothing to call on unmount, so channels leaked indefinitely.

Practical impact: messages unread badge stopped refreshing in real-time after first remount; users had to wait for the 60s polling fallback. Channel count grew over the session lifetime.

**Resolution:**  
- Channel name now includes user ID: `navigation-updates-${user.id}`
- Cleanup function is returned directly from the `useEffect`, with `channel` captured in a closure variable so unmount can call `supabase.removeChannel(channel)` reliably
- Added a `cancelled` flag so an in-flight `getUser()` doesn't subscribe after unmount

**Verification:**  
4 Jest unit tests in `__tests__/realtimeSubscriptionFixes.test.tsx` (Bug A suite):
- Channel name uses the user-scoped form, not the bare `navigation-updates`
- Both `.on()` handlers attach before `.subscribe()` (mock throws the exact production error if reversed)
- `removeChannel` is called on unmount
- Mount → unmount → remount produces two distinct, independently-cleaned channels (the old hardcoded-name bug would throw on the second mount)

All 4 passing.

---

### BUG-039: useConversationMessages — Auth Listener Unreachable + Receipts Channel Leak

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | Low (Realtime cleanup leak, sign-out edge case) |
| **Status** | ✅ Resolved |
| **Affects** | `src/hooks/useOptimizedConversations.ts` (`useConversationMessages` effect) |
| **Branch** | `bathoensescob/feat-superadmin-geographic-analytics` |

**Description:**  
Inside `useConversationMessages`'s realtime setup, an early `return () => { ... }` in the inner async function made the subsequent `authListener = supabase.auth.onAuthStateChange(...)` call unreachable. Two consequences:

1. **Auth state listener never registered** — sign-out while a conversation was open did not auto-cleanup the message subscription
2. **Receipts channel leaked on unmount** — the outer cleanup at lines 905-914 only removed `currentChannel` and called `authListener.data?.subscription?.unsubscribe()`; the receipts channel had no outer-scope reference and was never removed

Impact was bounded — component unmount of `useConversationMessages` is rare in normal navigation, and the conversation-list-level subscription has its own working auth listener — but the leaked receipts channels accumulated across conversation switches.

**Resolution:**  
- Removed the dead `return () => {...}` block that was short-circuiting the function
- Moved the receipts channel onto the outer scope via a new `receiptsChannelRef` variable so the outer cleanup can remove it
- The `authListener = supabase.auth.onAuthStateChange(...)` call now actually executes, and the outer cleanup correctly unsubscribes it on unmount

**Verification:**  
3 Jest unit tests in `__tests__/realtimeSubscriptionFixes.test.tsx` (Bug B suite):
- `supabase.auth.onAuthStateChange` is now called (was unreachable before)
- Both messages and receipts channels are created and subscribed
- Unmount removes both channels and unsubscribes the auth listener

All 3 passing.

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
| **BUG-032** | 2026-05-08 | Admin vehicle type raw enum display — Added label mapping for human-readable output. |
| **BUG-033** | 2026-05-08 | Admin user list duplicate entries — Deduplicated by aggregating roles per user. |
| **BUG-034** | 2026-05-08 | Host booking email approve/decline links 404 — Fixed fallback domain and added URL fields to payload. |
| **BUG-035** | 2026-05-08 | Test suite regressions (10 tests / 7 suites) — Fixed mock mismatches, stale assertions, TZ config, and component mismatches. |
| **BUG-036** | 2026-05-08 | UserBehavior dashboard geo/revenue/engagement tabs empty — Deployed 3 missing RPCs; 20/20 verification checks passing. |
| **BUG-037** | 2026-05-08 | Admin NotificationMonitoring canonical file missing — Created canonical component, updated AdminCampaigns import, removed orphan "Fixed" file. |
| **BUG-038** | 2026-05-08 | Navigation realtime channel collision + cleanup leak — User-scoped channel name; cleanup now returned from useEffect itself. |
| **BUG-039** | 2026-05-08 | useConversationMessages auth listener unreachable + receipts channel leak — Removed dead-code early return; tracked receipts channel on outer scope. |

---

## Roadmap Audit Status (MOB-210..MOB-225)

| ID | Issue | Status |
|---|---|---|
| **MOB-210** | Signup flow broken | 🟡 Re-Opened as **BUG-010** (76 orphaned users) |
| **MOB-211-225** | Handover, Payment, Notifications, Map, Claims | ✅ All Resolved |

---

*Updated by: Modisa Maphanyane — May 8, 2026 | BUG-032–039 added by Arnold T. Bathoen — May 8, 2026*
