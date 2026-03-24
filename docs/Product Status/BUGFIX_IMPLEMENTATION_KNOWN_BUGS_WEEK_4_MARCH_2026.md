# Bugfix Implementation — Known Bugs (Week 4 March 2026)

**Date:** March 24, 2026  
**Sprint:** Sprint 8 (Bugfix execution + validation)  
**Status:** Draft — owners to claim tickets during standup  
**Source of truth:** `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md` (Confirmed Bug Registry)  

## Why this document exists

Week reports reference a “**~40 known bugs**” metric, but the numeric count is not actionable on its own. This doc converts the registry behind that metric into **Jira-style implementation tasks** with **links to reference plans/hotfix docs** (and key related code modules when available).

## How to use

1. For each ticket below, open the referenced doc(s) to see the detailed “what/acceptance criteria”.
2. Claim a ticket (or a small cluster) under Sprint 8 for implementation.
3. Mark verification done by re-testing the relevant test IDs mentioned in the registry.

## References used for details

- Confirmed Bug Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
- Admin portal hotfix (MOB-100 epic): `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md`
- Avatar/image display issues: `docs/UI_DISPLAY_ISSUES_2026-02-02.md`
- Anonymize-on-delete plan (MOB-110, MOB-130..138): `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md`
- Rental lifecycle hotfix (MOB-200 epic; MOB-201..MOB-212 subset): `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md`

---

## A. Admin Portal / Discovery Backlog

### MOB-101 / MOB-102 / MOB-103 — Dashboard stats broken (ADM-002)

- Severity: P0/P0-like (tracked in admin hotfix backlog)
- Reference: `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` (Section MOB-101..MOB-103)
- Jira Tasks:
  - [ ] Implement the fixes described in the hotfix doc sections
  - [ ] Verify admin dashboard stats render with correct joins + badge mappings
  - [ ] Add/confirm regression: page load has no runtime/console errors and data renders in non-preview + preview modes
  - [ ] Re-test using the admin hotfix re-test checklist

### MOB-105 / MOB-106 — Admin capability assign/revoke broken (ADM-017/018)

- Severity: P1 (security/ops impact)
- Reference: `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` (Sections MOB-105..MOB-106)
- Jira Tasks:
  - [ ] Remove missing auth/role checks and ensure only intended roles can assign/revoke
  - [ ] Validate the UI writes correct records (no stale `user_roles`/capability state)
  - [ ] Confirm capability changes are reflected in the admin authorization paths
  - [ ] Re-test admin capability assign/revoke flows

### MOB-118 through MOB-126 — Avatar/image display issues

- Severity: P1/P2 cluster (display + trust degradation)
- Reference:
  - `docs/UI_DISPLAY_ISSUES_2026-02-02.md` (Issue 1 and related tasks)
  - `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` (for the remainder of the MOB-118..MOB-126 set)
- Jira Tasks:
  - [ ] Convert storage paths to public URLs using the shared avatar utility (where applicable)
  - [ ] Ensure all affected components correctly render avatars (no broken links, no missing placeholders)
  - [ ] Verify messaging + car-host sidebars + map host sidebars in light/dark mode
  - [ ] Re-test the avatar/image display tasks list in the UI issues doc

### MOB-110 + MOB-130 through MOB-138 — User deletion failures (Anonymize-on-Delete)

- Severity: P1 (data integrity + compliance)
- Reference: `docs/plans/ANONYMIZE_ON_DELETE_2026_03_02.md`
- Jira Tasks:
  - [ ] Implement migration/table changes and new soft-delete columns/flags (per phases)
  - [ ] Refactor edge functions (`delete-user-with-transfer`, `bulk-delete-users`) to anonymize instead of hard-delete
  - [ ] Add frontend/admin guards to filter/show deleted users safely
  - [ ] Re-test deletion flows end-to-end and confirm analytics tables remain intact

---

## B. Rental Lifecycle / Handover Edge Bugs (MOB-201..MOB-212 registry subset)

> Detailed implementation guidance for these tickets exists in:
> `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md`

### MOB-201 — Mark-as-read badge persists after reading messages (MSG-005)

- Severity: 🔴 High
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Likely areas (from codebase): `src/components/chat/MessagingInterface.tsx`, `src/hooks/useOptimizedConversations.ts`
- Jira Tasks:
  - [ ] Trace the “read state update” path and ensure the persisted field(s) update correctly (DB -> UI)
  - [ ] Ensure the badge derives from the same persisted source of truth after refresh/navigation
  - [ ] Add a regression test or a deterministic UI test route for read/unread state
  - [ ] Re-test MSG-005 after fix

### MOB-202 — Return handover flow completely broken (HAND-011)

- Severity: 🔴 Critical
- Reference: `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md` (Section MOB-202)
- Jira Tasks:
  - [ ] Implement fixes per the handover return flow acceptance criteria
  - [ ] Ensure booking status transitions align with return completion (no stuck `confirmed`)
  - [ ] Verify the return handover sheet/tray renders and updates on both mobile + desktop
  - [ ] Re-test HAND-011 + all downstream return completion expectations

### MOB-203 — GPS location tracking + real-time status sync broken (HAND-012/013)

- Severity: 🔴 High
- Reference: `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md` (Section MOB-203)
- Jira Tasks:
  - [ ] Validate geolocation acquisition and real-time sync behavior during handover lifecycle
  - [ ] Ensure status updates persist across disconnect/reconnect
  - [ ] Add instrumentation/logs where needed for QA reproducibility
  - [ ] Re-test HAND-012/013

### MOB-204 — Review submission fails (REV-001)

- Severity: 🔴 High
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant components: `src/components/verification/steps/ReviewSubmitStep.tsx`, `src/pages/RentalReview.tsx`
- Jira Tasks:
  - [ ] Identify failing submit path (validation, API call, or state transition)
  - [ ] Ensure the submit writes expected DB fields and returns correct UI state
  - [ ] Prevent double-submission and ensure proper loading/disabled states
  - [ ] Re-test REV-001

### MOB-205 — Host cannot respond to reviews (REV-004)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant components: `src/components/admin/ReviewManagementTable.tsx`, `src/pages/HostRentalReview.tsx`
- Jira Tasks:
  - [ ] Confirm the host response UI is wired to correct API/update route
  - [ ] Ensure review response state renders consistently after refresh
  - [ ] Add UI error handling for failed updates
  - [ ] Re-test REV-004

### MOB-206 — Booking extension request not functional (BOOK-019)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant component: `src/components/rental-details/RentalActions.tsx`
- Jira Tasks:
  - [ ] Verify extension request creation endpoint updates DB + status as intended
  - [ ] Ensure requester/host sees updated extension state in UI
  - [ ] Add backend validation (min/max extension rules) if missing
  - [ ] Re-test BOOK-019

### MOB-207 — Insurance package text not visible (INS-001)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant component: `src/components/insurance/InsurancePackageSelector.tsx`
- Jira Tasks:
  - [ ] Fix missing rendering/mapping of package “text” fields
  - [ ] Ensure data fetching populates selector display state
  - [ ] Add fallback UI for missing fields
  - [ ] Re-test INS-001

### MOB-208 — Claim status not visible to renter (INS-011)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant components: `src/components/insurance/UserClaimsList.tsx`, `src/components/insurance/AdminClaimsDashboard.tsx`
- Jira Tasks:
  - [ ] Verify renter claim list query includes status fields and maps them to UI
  - [ ] Confirm RLS policies allow renter to read claim status safely
  - [ ] Add placeholder UI while loading (no empty-state confusion)
  - [ ] Re-test INS-011

### MOB-209 — No “request more info” admin action on claims (INS-015)

- Severity: 🟢 Low (feature gap)
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Suggested area: `src/components/insurance/AdminClaimsDashboard.tsx`
- Jira Tasks:
  - [ ] Implement missing admin action to request additional claim evidence
  - [ ] Add DB update + notification to renter when requested
  - [ ] Ensure action is gated to admin role only
  - [ ] Re-test INS-015

### MOB-210 — Signup flow broken for some users (AUTH-009)

- Severity: 🔴 High
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant components: `src/pages/signup.tsx`, `src/components/auth/SignUpForm.tsx`
- Jira Tasks:
  - [ ] Identify failing signup subset (schema mismatch, validation bug, or RLS behavior)
  - [ ] Ensure consent required checks match server-side expectations
  - [ ] Confirm correct error display for failed users (no silent failures)
  - [ ] Re-test AUTH-009 with affected user cohort

### MOB-211 — RentalPaymentDetails missing surcharge line (RentalPaymentDetails missing destination surcharge)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant component: `src/components/rental-details/RentalPaymentDetails.tsx`
  - Also described in rental lifecycle hotfix doc: `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md`
- Jira Tasks:
  - [ ] Ensure destination type is passed through and the surcharge line item renders correctly
  - [ ] Validate it matches pricing rules (local/out_of_zone/cross_border)
  - [ ] Confirm it updates for both create and edit flows (if applicable)
  - [ ] Re-test MOB-211

### MOB-212 — RenterBookingCard lacks active/return states (BOOK-009)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Suggested area: `src/components/renter-bookings/RenterBookingCard.tsx`
  - Also described in rental lifecycle hotfix doc: `docs/hotfixes/HOTFIX_RENTAL_LIFECYCLE_2026_03_06.md`
- Jira Tasks:
  - [ ] Add/validate UI state derivation for `in_progress` and return-ready conditions
  - [ ] Ensure statuses match backend transition logic (no mismatch in badge mapping)
  - [ ] Validate correct CTA availability for active vs return bookings
  - [ ] Re-test MOB-212

---

## C. Wallet / Notifications / Maps / Car Discovery Bugs (MOB-213..MOB-225)

These tickets do not appear to have dedicated hotfix docs yet; execution here is based on the registry + scoped code modules.

### MOB-213 — Transaction history fails to load (WALL-002)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant code: `src/components/dashboard/WalletTransactionHistory.tsx`
- Jira Tasks:
  - [ ] Trace the wallet transaction query; confirm fields and RLS scope for host
  - [ ] Fix loading/empty-state logic so failures surface explicitly
  - [ ] Ensure pagination/filtering does not break query conditions
  - [ ] Re-test WALL-002

### MOB-214 — Handover notifications not sent (HAND-014)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant services: `src/services/handoverService.ts`, `src/services/handoverPromptService.ts`
- Jira Tasks:
  - [ ] Confirm handover event triggers publish notifications
  - [ ] Verify notifications are written with correct recipient IDs + category/action enums
  - [ ] Add logging for QA to validate trigger conditions
  - [ ] Re-test HAND-014

### MOB-215 — Handover state not preserved after disconnect (HAND-015)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/components/handover/ResizableHandoverTray.tsx`
- Jira Tasks:
  - [ ] Validate disconnect/reconnect rehydrates handover session state
  - [ ] Ensure state transitions persist in DB and UI reads the persisted state
  - [ ] Add robust “resume” behavior (idempotent fetches)
  - [ ] Re-test HAND-015

### MOB-216 — Notification mark-as-read fails (NOTIF-003)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant code: `src/hooks/useNotifications.ts`, `src/pages/NotificationsRefactored.tsx`
- Jira Tasks:
  - [ ] Fix `markAsRead` mutation or ensure correct DB update + UI refresh
  - [ ] Ensure badge derives from updated `is_read` field
  - [ ] Add error reporting on mutation failures
  - [ ] Re-test NOTIF-003

### MOB-217 — Handover notifications not in Active Rentals tab (NOTIF-008)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/pages/NotificationsRefactored.tsx`
- Jira Tasks:
  - [ ] Verify filter logic for “Active Rentals” tab includes handover notification categories
  - [ ] Ensure tabs map to correct query predicates
  - [ ] Add guard for missing/undefined categories
  - [ ] Re-test NOTIF-008

### MOB-218 — Notification preferences not saving (NOTIF-009)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/pages/NotificationPreferencesPage.tsx`
- Jira Tasks:
  - [ ] Fix preference mutation; ensure it persists server-side
  - [ ] Ensure UI reflects persisted preferences after refresh
  - [ ] Confirm RLS allows the authenticated user to update their own preferences only
  - [ ] Re-test NOTIF-009

### MOB-219 — Audit logs not displaying (ADM-014)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/pages/admin/AdminAudit.tsx`, `src/components/admin/AuditLogViewer.tsx`
- Jira Tasks:
  - [ ] Fix API/query so audit logs return correctly (schema + ordering)
  - [ ] Ensure viewer component maps fields correctly to UI
  - [ ] Validate admin auth gating for the audit route
  - [ ] Re-test ADM-014

### MOB-220 — Geolocation centering fails (MAP-002)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI/page: `src/pages/Map.tsx`
- Jira Tasks:
  - [ ] Fix geolocation centering path (permissions, token init, map view updates)
  - [ ] Ensure fallback behavior when geolocation fails
  - [ ] Add logs for QA reproducibility
  - [ ] Re-test MAP-002

### MOB-221 — Location search fails (MAP-003)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant input: `src/components/location/LocationSearchInput.tsx`
- Jira Tasks:
  - [ ] Fix search query call chain and ensure results render markers consistently
  - [ ] Validate debouncing and error handling
  - [ ] Re-test MAP-003 with multiple query inputs

### MOB-222 — Advanced map features broken (MAP-007/008/009/010)

- Severity: 🟢 Low
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant services: `src/services/mapboxSearchService.ts` + map page logic: `src/pages/Map.tsx`
- Jira Tasks:
  - [ ] Fix advanced map features: navigation, reroute, traffic, ETA
  - [ ] Ensure UI state matches successful service results (no stale loading)
  - [ ] Validate cleanup of map layers on navigation changes
  - [ ] Re-test MAP-007..010

### MOB-223 — Evidence upload UX — no immediate navigation (INS-009)

- Severity: 🟢 Low
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/components/insurance/UserClaimsList.tsx`, plus insurance claim submit flow components
- Jira Tasks:
  - [ ] Ensure evidence upload success navigates to the expected evidence/claim state
  - [ ] Ensure upload errors are surfaced and not swallowed
  - [ ] Re-test INS-009

### MOB-224 — No payout processing visibility for admin claims (INS-013)

- Severity: 🟢 Low
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant UI: `src/components/insurance/AdminClaimsDashboard.tsx`
- Jira Tasks:
  - [ ] Verify payout/processing status is loaded and displayed for admin claim rows
  - [ ] Fix any missing joins or mapping into the admin dashboard UI
  - [ ] Add placeholder/error rendering when payout info is missing
  - [ ] Re-test INS-013

### MOB-225 — Car filter by location not working (CAR-003)

- Severity: 🟡 Medium
- Reference:
  - Registry: `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`
  - Relevant code: `src/pages/CarListing.tsx`, `src/components/SearchFilters.tsx`, `src/utils/carFetching.ts`
- Jira Tasks:
  - [ ] Fix filtering query construction and ensure it matches the UI filter value semantics
  - [ ] Validate filter updates trigger fetch/refetch correctly
  - [ ] Ensure pagination results respect the location filter
  - [ ] Re-test CAR-003

---

## D. Sprint 8 Suggested Execution Order

To reduce merge conflicts and module interleaving, execute in this order:

1. Admin portal + audit visibility (MOB-101..103, MOB-105..106, MOB-118..126, MOB-219)
2. Rental lifecycle + handover events (MOB-202..212 subset)
3. Wallet + notifications (MOB-213..218)
4. Maps + car discovery (MOB-220..222, MOB-225)
5. Insurance end-user/admin UX (MOB-207..208, MOB-223..224, plus MOB-209 admin action if required)

Each phase should complete: implement + re-test for the corresponding test IDs.

