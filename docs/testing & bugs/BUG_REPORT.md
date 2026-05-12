# Mobi Rides Bug Report & Technical Debt Tracking

This document tracks all known bugs, UI/UX regressions, and technical debt identified during the V1.0 production cycle.

---

## High Priority / Blocking Bugs

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

### BUG-040: False Map Initialization Error on Non-Map Pages

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

### BUG-041: Auth Form Labels Are Nearly Invisible in Dark Mode

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

### BUG-042: Floating Chat Button Covers Auth Form Controls on Mobile

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

### BUG-043: Branded Password Reset Email Can Send a Tokenless Reset Link

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

### BUG-044: Invalid Vehicle Detail Links Leave Users Waiting Before Showing a Generic Error

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

### BUG-045: Car Listing Filters Are Visible but Mostly Ignored

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

### BUG-046: Host Booking CSV/PDF Export Buttons Do Not Export Files

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

### BUG-047: Pending Renter Booking Shows “Pay Now” but Does Not Open Payment

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

### BUG-048: Payment Return Page Sends Users to a Non-Existent Bookings Route

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

### BUG-049: `/create-car` Route Shows a Listing Form but Does Not Create a Car

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

### BUG-050: Receipt “Download PDF” Button Does Not Download Anything

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

### BUG-051: Booking Approval and Payment Transitions Do Not Send Visible Push Notifications

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

### BUG-052: Booking Reminder Notifications Are Only Partially Created

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

### BUG-053: Payment Return Page Never Reaches Success After Live Payment Initiation

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
| **BUG-011** | 2026-05-08 | Missing SuperAdmin Core RPCs — `transfer_vehicle`, `remove_restriction` finalized. |
| **BUG-015** | 2026-05-08 | Admin Analytics — Implemented registration/booking growth aggregation. |
| **BUG-016** | 2026-05-08 | CSV Export — Refactored bulk export to include full user metadata. |
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

*Updated by: Modisa Maphanyane — May 8, 2026 | BUG-032–039 added by Arnold T. Bathoen — May 8, 2026 | UI audit bugs BUG-040–053 added via Codex — May 8, 2026*
