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

### BUG-032: False Map Initialization Error on Non-Map Pages

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Core auth pages look broken) |
| **Status** | 🔴 Open |
| **Affects** | `/login`, `/signup`, `/forgot-password`, `/terms-of-service`, protected-route sign-in screens |
| **Visible Result** | Users see `Failed to initialize map. Please try again later.` on pages that do not display a map. |

**Description:**  
After pulling latest `origin/develop`, mobile UI smoke testing at 390×844 shows the Mapbox error toast on every public/auth page tested. This is user-visible before any interaction and makes login/signup/legal pages appear broken.

**Likely Cause:**  
`MapboxTokenProvider` wraps the entire app in `App.tsx` and emits a global toast when token initialization fails (`src/contexts/MapboxTokenContext.tsx`). Map token initialization should be scoped to map-dependent routes/components, or token failures should be silent outside map UI.

**Verification:**  
`npm run build` passes. Reproduced locally with Vite on `/login`, `/signup`, `/forgot-password`, `/terms-of-service`, `/profile`, `/bookings`, and `/wallet`.

---

### BUG-033: Auth Form Labels Are Nearly Invisible in Dark Mode

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Users cannot reliably identify required auth fields) |
| **Status** | 🔴 Open |
| **Affects** | `Login.tsx`, `signup.tsx`, `ForgotPassword.tsx`, protected-route sign-in screens |
| **Visible Result** | Labels such as `Email`, `Password`, `Full Name`, and `Phone Number` render nearly white on white cards. |

**Description:**  
On mobile with the app in dark theme, auth page containers are hardcoded to light surfaces (`bg-gray-50`, `bg-white`) while field labels inherit dark-theme foreground color. Selenium confirmed label color `rgb(248, 250, 252)` on the white auth cards, making labels effectively unreadable.

**Likely Cause:**  
Auth pages use fixed light backgrounds while shared auth form labels rely on theme tokens. Either force dark text inside the light auth cards or convert these screens to theme-aware `bg-card text-card-foreground` surfaces.

**Verification:**  
Reproduced on `/signup`, `/forgot-password`, `/profile`, `/bookings`, and `/wallet`; `/profile`, `/bookings`, and `/wallet` show the same sign-in form through the protected-route auth flow.

---

### BUG-034: Floating Chat Button Covers Auth Form Controls on Mobile

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Blocks or obscures core auth inputs/actions) |
| **Status** | 🔴 Open |
| **Affects** | `/signup`, `/forgot-password`, `/password-reset-sent`, `/car-listing`, protected-route sign-in screens, public legal pages |
| **Visible Result** | The floating chat button overlaps signup phone input, forgot-password submit button, password-reset confirmation content, car-listing filter controls, and sign-in button areas. |

**Description:**  
Mobile smoke testing at 390×844 shows the global floating chat button positioned over primary page controls. On `/signup`, it covers the right side of the phone input. On `/forgot-password`, it sits over the `Send Reset Email` button. On `/password-reset-sent`, it covers the reset confirmation copy / action area. On `/car-listing`, it covers the filter sort control area above `Apply Filters`. On protected-route sign-in screens, it overlaps the right side of the `Sign In` button.

**Likely Cause:**  
`ChatManager` renders globally with `SHOW_FLOATING_CHAT = true`, and `FloatingChatButton` uses `fixed bottom-[25vh] right-6 z-40`. The button should be hidden on auth/legal pages and unauthenticated protected-route sign-in screens, or repositioned so it cannot cover form controls.

**Verification:**  
`npm run build` passes. Reproduced locally on mobile screenshots for `/signup`, `/forgot-password`, `/password-reset-sent`, `/car-listing`, `/profile`, `/bookings`, and `/wallet`.

---

### BUG-035: Branded Password Reset Email Can Send a Tokenless Reset Link

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Password recovery link can appear broken to users) |
| **Status** | 🔴 Open |
| **Affects** | Password reset email flow, `/reset-password` |
| **Visible Result** | A user clicking the branded reset link can land back on sign-in instead of seeing the password reset form. |

**Description:**  
The reset page requires `?token=...&redirectedFromEmail=true` before it will render the reset form. However `api/auth/reset-password.js` sends the `password-reset` Resend template with `reset_url` and `confirmation_url` set to `/reset-password` without a token. If a user clicks that branded email link, the UI treats it as invalid and redirects them to sign-in.

**Likely Cause:**  
There are two reset-email paths: the custom Resend template gets a tokenless URL, while Supabase's built-in reset is triggered separately. The visible branded email link must include the same recovery token format that `ResetPassword.tsx` expects, or `ResetPassword.tsx` must support Supabase's redirect/session format.

**Verification:**  
Source confirmed in `api/auth/reset-password.js` and `src/pages/ResetPassword.tsx`. Directly opening `/reset-password` reproduces the visible failure by redirecting to the sign-in screen instead of presenting reset instructions or a reset form.

---

### BUG-036: Invalid Vehicle Detail Links Leave Users Waiting Before Showing a Generic Error

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Broken/shared vehicle links appear to hang) |
| **Status** | 🔴 Open |
| **Affects** | `/cars/:carId` |
| **Visible Result** | Invalid vehicle URLs show `Loading vehicle details...` for roughly 15 seconds before changing to a generic error. |

**Description:**  
Mobile smoke testing `/cars/test-id` at 390×844 showed the page stuck on `Loading vehicle details...` at 3 and 8 seconds, then only changing to `Error loading vehicle details` around 15 seconds. Browser logs showed repeated 400 responses from the cars query before the error screen appeared. This creates a broken-link experience for users opening malformed or stale shared vehicle links.

**Likely Cause:**  
`CarDetails.tsx` queries Supabase with `carId` directly and lets React Query retry invalid ID errors. Non-UUID / invalid IDs should be validated client-side and fail fast into a clear `Vehicle not found` state rather than retrying server 400s.

**Verification:**  
Reproduced locally on `/cars/test-id`. The error eventually appears, but only after repeated failed requests and a long loading state.

---

### BUG-037: Car Listing Filters Are Visible but Mostly Ignored

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Search/discovery feature gives incorrect results) |
| **Status** | 🔴 Open |
| **Affects** | `/car-listing`, `SearchFilters.tsx`, `CarListing.tsx` |
| **Visible Result** | Users can enter model, year, min price, max price, date range, and distance sort filters, but the results are not filtered by those values. |

**Description:**  
The car listing page exposes filter controls for model, year, price range, dates, vehicle type, pickup location, and sort by distance/price. `CarListing.tsx` only applies `location` and `vehicleType`, then maps `sortBy !== "price"` to `created_at`. This means model, year, min/max price, selected dates, and distance sorting are accepted in the UI but ignored in the query.

**Likely Cause:**  
`SearchFilters.tsx` tracks a richer `SearchFilters` object, but `CarListing.tsx` only consumes a small subset of it. Distance sorting also needs coordinates and distance calculation instead of falling back to `created_at`.

**Verification:**  
Source confirmed after browser smoke testing `/car-listing` at mobile and desktop sizes. The UI presents the controls, while the query only applies `filters.location`, `filters.vehicleType`, and price/created_at sorting.

---

### BUG-038: Host Booking CSV/PDF Export Buttons Do Not Export Files

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Host reporting/export workflow is non-functional) |
| **Status** | 🔴 Open |
| **Affects** | `/host-bookings`, `HostBookings.tsx` |
| **Visible Result** | Hosts can tap `CSV` or `PDF`, but the app only shows an “Export Started” toast and does not generate or download anything. |

**Description:**  
The host bookings page displays CSV and PDF export buttons as real actions. The `exportData` handler only calls a toast and contains a placeholder comment. No file is created, no download starts, and no data is exported.

**Likely Cause:**  
Export UI was shipped before the export implementation. Either implement CSV/PDF generation or remove/disable the buttons until the feature exists.

**Verification:**  
Source confirmed in `HostBookings.tsx`: `exportData()` only displays a toast. The buttons are wired directly to that placeholder handler.

---

### BUG-039: Pending Renter Booking Shows “Pay Now” but Does Not Open Payment

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Misleads renters in payment workflow) |
| **Status** | 🔴 Open |
| **Affects** | `/renter-bookings`, `RenterBookingCard.tsx` |
| **Visible Result** | Pending bookings show a `Pay Now` button even though payment is only actionable after the booking is approved / awaiting payment. |

**Description:**  
`RenterBookingCard` renders the same `Pay Now` button for both `awaiting_payment` and `pending` bookings. For `awaiting_payment`, it opens the payment modal. For `pending`, clicking the same visible `Pay Now` button navigates to rental details instead of opening payment. This makes renters think they can pay for a request that is still waiting for host approval.

**Likely Cause:**  
The status condition combines `awaiting_payment` and `pending` for a payment-labeled CTA. Pending bookings should use a different label such as `View Request` / `View Details`, or hide payment actions until the status is `awaiting_payment`.

**Verification:**  
Source confirmed in `RenterBookingCard.tsx`: the button label remains `Pay Now`, but the click handler only calls `onPayNow` when `booking.status === "awaiting_payment"` and otherwise navigates to details.

---

### BUG-040: Payment Return Page Sends Users to a Non-Existent Bookings Route

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Payment recovery/navigation flow can end in 404) |
| **Status** | 🔴 Open |
| **Affects** | `/payment/return`, `PaymentReturnPage.tsx` |
| **Visible Result** | If the payment return page cannot resolve a booking ID, its recovery buttons navigate to `/my-bookings`, which is not a registered route. |

**Description:**  
The payment return screen uses `/my-bookings` as the fallback destination for success, failure, and missing transaction states. The app route table registers `/bookings`, `/host-bookings`, and `/renter-bookings`, but not `/my-bookings`. A user whose payment status cannot be mapped to a booking will be sent to the 404 page when they tap `View Booking`, `Return to Booking`, or `Go to Bookings`.

**Likely Cause:**  
`PaymentReturnPage.tsx` retained an old route name after booking routes were consolidated behind `/bookings` / role-aware redirects.

**Verification:**  
Source confirmed in `PaymentReturnPage.tsx`; `App.tsx` has no `/my-bookings` route.

---

### BUG-041: `/create-car` Route Shows a Listing Form but Does Not Create a Car

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Vehicle listing flow can silently lose user work) |
| **Status** | 🔴 Open |
| **Affects** | `/create-car`, `CreateCar.tsx` |
| **Visible Result** | Users can fill and submit the `/create-car` form, but no vehicle is inserted or uploaded; the page just navigates away. |

**Description:**  
The app registers `/create-car` as a protected route and renders the same `CarForm` pattern as the real add-car flow. Its submit handler only toggles `isSubmitting` and navigates to `/cars`, while the comment says “Submission logic would go here.” There is no `/cars` index route, only `/cars/:carId`, so this flow both fails to create the listing and sends users to an invalid route afterward.

**Likely Cause:**  
`CreateCar.tsx` appears to be an unfinished duplicate of `AddCar.tsx` that was left registered in production routing.

**Verification:**  
Source confirmed in `CreateCar.tsx` and `App.tsx`. The actual implemented listing flow lives in `/add-car`.

---

### BUG-042: Receipt “Download PDF” Button Does Not Download Anything

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Receipt/export workflow is non-functional) |
| **Status** | 🔴 Open |
| **Affects** | Receipt modal, `ReceiptModal.tsx` |
| **Visible Result** | Users see a `Download PDF` receipt button, but clicking it does not generate or download a PDF. |

**Description:**  
The rental receipt modal has working receipt content and a `Download PDF` CTA. The handler contains only a future-implementation comment and `console.log`, so the visible feature does nothing for users.

**Likely Cause:**  
Receipt PDF generation was exposed in UI before implementation. Either wire it to the existing PDF/export utility stack or hide/disable the button until supported.

**Verification:**  
Source confirmed in `ReceiptModal.tsx`: `handleDownload()` only logs `Download receipt for booking`.

---

### BUG-043: Booking Approval and Payment Transitions Do Not Send Visible Push Notifications

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Users can miss booking approval/payment state changes) |
| **Status** | 🔴 Open |
| **Affects** | Booking lifecycle notifications, `bookingLifecycle.ts`, `completeNotificationService.ts` |
| **Visible Result** | Renters and hosts may not receive expected notifications when a booking moves to awaiting payment or confirmed/paid. |

**Description:**  
The booking/payment trigger contract suite passes, but the adjacent booking lifecycle tests show notification side effects failing during key user-visible transitions. The `pending -> awaiting_payment` transition does not call the expected renter push notification, and the `confirmed` / `paid` transition does not send the expected renter and host notifications.

**Likely Cause:**  
The lifecycle path now routes through `completeNotificationService.createNotification`, but the tested Supabase insert path is failing with `supabase.from(...).insert is not a function`. This can prevent visible booking status notifications from being created or pushed even when the booking state itself changes.

**Verification:**  
`npx jest __tests__/bookingPaymentTriggers.test.ts __tests__/bookingLifecycle.test.ts __tests__/enhancedBookingService.test.ts --runInBand` fails in `bookingLifecycle.test.ts` on the missing notification calls. Console errors point to `src/services/completeNotificationService.ts:114`; transition side effects are triggered from `src/services/bookingLifecycle.ts`.

---

### BUG-044: Booking Reminder Notifications Are Only Partially Created

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Upcoming-trip reminders can be missed) |
| **Status** | 🔴 Open |
| **Affects** | Booking reminders, `enhancedBookingService.ts` |
| **Visible Result** | Users may receive only some scheduled booking reminders instead of the expected 24h, 2h, and 30m reminders. |

**Description:**  
The enhanced booking service reminder test expects reminder notifications for all configured windows, but only part of the expected inserts occur. This means upcoming rental reminder coverage can be incomplete, leaving renters or hosts without visible prompts before pickup/handover.

**Likely Cause:**  
The reminder processing path is not creating all notification records for the configured reminder windows, or the query/filter path is excluding some reminders before insert.

**Verification:**  
`__tests__/enhancedBookingService.test.ts` fails in `processes booking reminders for 24h, 2h and 30m windows`: expected 6 notification inserts, received 2.

---

### BUG-045: Payment Return Page Never Reaches Success After Live Payment Initiation

| Field | Detail |
|-------|--------|
| **Date Reported** | 2026-05-08 |
| **Severity** | High (Payment confirmation flow can hang/fail after payment starts) |
| **Status** | 🔴 Open |
| **Affects** | `/payment/return`, `initiate-payment`, `payment-webhook`, `query-payment` |
| **Visible Result** | After payment is initiated, the user lands on the payment return flow but never sees `Payment successful`; the booking remains unconfirmed. |

**Description:**  
The live Selenium booking/payment flow successfully signed in the renter, created a pending booking, called `initiate-payment`, and opened the returned payment URL. The return page then timed out waiting for the success state. Direct database verification showed the booking was updated to `payment_status=awaiting_payment` with a transaction ID, but the booking stayed `status=pending` and the transaction stayed `status=initiated`.

**Likely Cause:**  
`initiate-payment` creates a transaction and fires a mock `payment-webhook` request asynchronously, but the webhook is not completing the transaction in the live environment. Because `PaymentReturnPage` only shows success when `query-payment` returns `status=completed`, users remain in the processing/failure path and the booking never becomes confirmed/paid.

**Verification:**  
Selenium run against local Vite and live Supabase created booking `a3dbeb76-4e50-4896-9202-1df145529398` and transaction `2b7768cd-1a6a-4a41-b0a2-4886d4e50a6b`. Final live state: booking `status=pending`, `payment_status=awaiting_payment`; transaction `status=initiated`. The script failed while waiting for `Payment successful`.

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

*Updated by: Codex UI audit — May 8, 2026*
