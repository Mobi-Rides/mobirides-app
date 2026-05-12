# BOOKING → PAYMENT → HANDOVER: UI FLOW & REALTIME REMEDIATION PLAN
**Document ID:** MOB-PAY-003  
**Date:** 2026-05-07  
**Status:** In Progress — Realtime Infrastructure Next 🏗️
**Priority:** 🔴 P0 — Launch Blocker  
**Sprint Target:** Sprint 13 (May 2026)  
**Author:** Engineering  
**Related Plans:**
- [`PAYMENT_INTEGRATION_IMPLEMENTATION.md`](./PAYMENT_INTEGRATION_IMPLEMENTATION.md) — Master payment spec v1.3 (custodial model)
- [`20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`](./20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md) — PayGate/Ooze integration gaps
- [`20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`](./20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md) — Email trigger audit

---

## 1. Executive Summary

A systematic audit of the booking-to-payment lifecycle (conducted 2026-05-07) has identified that the "Pay Now" action button is **completely absent** from every UI surface a renter actually visits. This is not a logic error — it is a **component fragmentation failure**: the component that contains the Pay Now button (`RenterBookingCard.tsx`) is imported by no active route, while the components that are rendered (`BookingMobileCard.tsx`, `BookingRow.tsx`) were never built with payment actions.

Compounding this, there are **zero Supabase Realtime subscriptions** across the renter and host booking flows, meaning status transitions (e.g., host approving a booking to `awaiting_payment`) are invisible to the renter until they manually reload. The global React Query config (`staleTime: 5min`, `refetchOnWindowFocus: false`) makes stale-data persistence the default behaviour.

This plan defines the full remediation scope across UI components, routing, realtime subscriptions, notification accuracy, and the `?pay=true` redirect dead-end — all referenced against the custodial "Request First, Pay Later" model defined in `PAYMENT_INTEGRATION_IMPLEMENTATION.md §3.1`.

---

## 2. Impact Assessment

### 2.1 Business Impact
| Impact Area | Severity | Description |
|---|---|---|
| **Zero payment conversions** | 🔴 Critical | Renters cannot pay even after host approves. No revenue can flow through the platform. |
| **Silent booking abandonment** | 🔴 Critical | Renters see no actionable UI after submitting a request. They assume the app is broken and abandon. |
| **Host approval effort wasted** | 🔴 Critical | Host approves a booking — renter never knows. Payment deadline expires. Booking auto-cancels. |
| **Eroded trust** | 🟠 High | Confirmation emails sent before approval create false expectations and confusion. |
| **Support overload** | 🟠 High | Users contact support asking "what happened to my booking?" as there is no visible status lifecycle. |

### 2.2 Technical Debt Impact
| Debt Item | Root Cause |
|---|---|
| Orphaned `RenterBookingCard` component | Built in isolation, never wired to the router |
| 3 parallel booking list components not in sync | `BookingMobileCard`, `BookingRow`, `RenterBookingCard` — all diverged |
| `?pay=true` redirect is a documented no-op | `RentalDetailsRefactored` blocks modal on `pending` status; `BookingDialog` redirects regardless |
| 0 Realtime subscriptions in renter/host flow | All data fetching via `useQuery` with no invalidation triggers |
| Global React Query `staleTime: 5min` | Cached stale statuses persist across navigation, masking status changes |

---

## 3. Full Root Cause Analysis

### 3.1 Routing Chain (Renter)

```
User clicks "Book Now"
  → BookingDialog (4-step wizard: dates / insurance / summary / confirm)
  → booking inserted with status: 'pending'
  → navigate('/rental-details/:id?pay=true')          ← DEAD-END (see §3.2)

User navigates to "My Bookings"
  → /bookings
  → RoleAwareBookingsRedirect.tsx
  → userRole === 'renter' → navigate('/renter-bookings')
  → RenterBookings.tsx → BookingTable.tsx
  → mobile: BookingMobileCard.tsx                     ← NO Pay Now button (see §3.3)
  → desktop: BookingRow.tsx                           ← NO Pay Now button (see §3.3)
```

### 3.2 The `?pay=true` Dead-End

**File:** `BookingDialog.tsx` line 610–615  
```tsx
if (booking.status === 'awaiting_payment' || booking.status === 'pending') {
  navigate(`/rental-details/${booking.id}?pay=true`);
  handleDialogClose();
}
```
A new booking is always `pending` (host approval required). `RentalDetailsRefactored.tsx` line 76 guards the payment modal:
```tsx
if (shouldOpen && booking?.status === 'awaiting_payment') { // 'pending' fails → modal never opens
```
**Result:** The redirect fires, the renter lands on the details page, the payment modal silently does not open. The renter sees a booking details page with no actionable buttons.

The `BookingSuccessModal` (`isSuccessModalOpen`) is correctly built and shows "Booking Request Submitted" with a "What happens next?" explanation — **but it is never shown**, because the `else` branch that opens it is never reached when status is `pending` or `awaiting_payment`.

### 3.3 Component Fragmentation — The Pay Now Button

Three booking list components exist. Only two are rendered. The one with Pay Now is rendered nowhere.

| Component | Route Rendered On | Pay Now? | `awaiting_payment` Badge? |
|---|---|---|---|
| `BookingMobileCard.tsx` | `/renter-bookings` (mobile) | ❌ Never built | ❌ Falls to `default`, shows raw text |
| `BookingRow.tsx` | `/renter-bookings` (desktop) | ❌ Never built | ❌ Falls to `default`, shows raw text |
| `RenterBookingCard.tsx` | **No active route** — orphaned | ✅ Exists | ✅ Exists |

`RenterBookingCard` is imported only by `RenterBookings.tsx` — **wait, it is not**. `RenterBookings.tsx` passes to `BookingTable`, which uses `BookingMobileCard`/`BookingRow`. `RenterBookingCard` is imported by no file in the active render tree.

**On the Rental Details page:** `RentalActions.tsx` line 56 does have a correctly gated Pay Now button:
```tsx
{booking.status === 'awaiting_payment' && booking.payment_status !== 'paid' && isRenter && (
  <Button onClick={onPayNow}>Pay Now</Button>
)}
```
This is correct and would work — **but `isRenter` depends on `currentUser` being loaded**, and the stale React Query cache may still show `pending` status when the host has approved, so the condition evaluates to false.

### 3.4 Zero Realtime Subscriptions — Full Map

The master spec (`PAYMENT_INTEGRATION_IMPLEMENTATION.md §6.2`) requires realtime status propagation. Current state:

| File | Realtime Required | Has It | Consequence |
|---|---|---|---|
| `useRentalDetails.ts` | ✅ Yes | ❌ No | Booking status changes invisible without page reload |
| `RenterBookings.tsx` | ✅ Yes | ❌ No | `awaiting_payment` badge never updates |
| `HostBookings.tsx` | ✅ Yes | ❌ No | New pending requests not surfaced live |
| `NotificationsRefactored.tsx` | ✅ Yes | ❌ No | Bell count and list don't update live |
| `RentalDetailsRefactored.tsx` | ✅ Yes | ❌ No | Payment modal never auto-opens on approval |

### 3.5 Dual Host Approval Paths (Notification Gap)

Referenced in `PAYMENT_INTEGRATION_IMPLEMENTATION.md §4.3`:  
- **Path A:** `HostBookings.tsx` line 150 → `supabase.from('bookings').update()` directly → **bypasses** `bookingLifecycle.updateStatus()` → **no email sent to renter**
- **Path B:** `BookingRequestDetails.tsx` line 111 → `bookingLifecycle.updateStatus()` → email + push sent correctly

When a host approves from the list view (most common UX path), the renter receives **no notification** to pay.

### 3.6 Global React Query Config Amplifies All Issues

**File:** `App.tsx` lines 30–34
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // Cache persists 5 minutes
      refetchOnWindowFocus: false,   // No refresh on tab focus
    },
  },
});
```
Even when a renter navigates back to their bookings after the host approves, they see the cached `pending` status for up to 5 minutes. This is correct behaviour for read-heavy data (e.g., car listings) but **must be overridden** for booking status queries.

### 3.7 Email Notification Inaccuracy

**File:** `BookingDialog.tsx` lines 488, 522  
`sendBookingConfirmation()` is called with `type: 'confirmed'` before host approval. Per `PAYMENT_INTEGRATION_IMPLEMENTATION.md §5.1`, the correct email at this stage is `booking_request_received` (renter) and `new_booking_request` (host). "Confirmed" must only fire post-payment webhook.

---

## 4. Jira Tickets

### EPIC: MOB-PAY-003 — Booking-Payment-Handover Flow Remediation

---

### 🔴 MOB-PAY-003-01 — Fix Post-Booking Redirect: Replace `?pay=true` No-Op with Success Modal
**Type:** Bug Fix  
**Priority:** P0  
**Estimate:** 2 points  
**File:** `src/components/booking/BookingDialog.tsx`

**Problem:** Line 610–615 redirects to `?pay=true` for `pending` bookings. This is a no-op. `BookingSuccessModal` is built and correct but never shown for the request flow.

**Acceptance Criteria:**
- [ ] After booking submission with `status === 'pending'`, `setIsSuccessModalOpen(true)` is called (not `navigate`)
- [ ] `BookingSuccessModal` displays with copy: "Request Submitted — The host is reviewing your request"
- [ ] `BookingSuccessModal` auto-redirects to `/renter-bookings` after 5s countdown (not `/rental-details/:id?pay=true`)
- [ ] `?pay=true` redirect is **only** used if booking is somehow instantly `awaiting_payment` (edge case for future instant-book)
- [ ] "Book Now" button label in `CarActions.tsx` changed to "Request"

---

### 🔴 MOB-PAY-003-02 — Add Pay Now Button to `BookingMobileCard` and `BookingRow`
**Type:** Bug Fix / Feature Gap  
**Priority:** P0  
**Estimate:** 3 points  
**Files:** `src/components/booking/BookingMobileCard.tsx`, `src/components/booking/BookingRow.tsx`

**Problem:** Neither component has a Pay Now button or an `awaiting_payment` status badge. `RenterBookingCard` has both but is orphaned.

**Option A (Recommended):** Add Pay Now action and `awaiting_payment` badge to both active components.  
**Option B:** Replace `BookingTable` usage of `BookingMobileCard`/`BookingRow` with `RenterBookingCard` and update `RenterBookingCard` to accept `onCancelBooking` prop.

**Acceptance Criteria:**
- [ ] `awaiting_payment` renders a styled orange badge (matching `RenterBookingCard` implementation) in both mobile and desktop views
- [ ] "Pay Now" button renders for `booking.status === 'awaiting_payment'` in both views
- [ ] "Pay Now" navigates to `/rental-details/:id` (not `?pay=true`) — details page handles modal
- [ ] `PaymentDeadlineTimer` (compact variant) renders below the Pay Now button for `awaiting_payment` bookings
- [ ] `pending` status shows "Cancel" button only — no Pay Now
- [ ] Decision: Deprecate/delete `RenterBookingCard` or wire it to the route — no orphaned components

---

### 🔴 MOB-PAY-003-03 — Fix Dual Host Approval Paths: Unify via `bookingLifecycle.updateStatus()`
**Type:** Bug Fix  
**Priority:** P0  
**Estimate:** 2 points  
**File:** `src/pages/HostBookings.tsx`

**Problem:** `handleBookingAction()` at line 150 calls `supabase.from('bookings').update()` directly, bypassing all side effects in `bookingLifecycle.updateStatus()`. When a host approves from the list view, no email is sent to the renter.

**Acceptance Criteria:**
- [x] `HostBookings.handleBookingAction()` replaced with call to `bookingLifecycle.updateStatus(bookingId, 'awaiting_payment')`
- [x] Renter receives push notification AND email ("Your booking request was approved — please complete payment") when host approves from list view
- [x] Existing test: approval from `BookingRequestDetails.tsx` continues to work unchanged
- [x] Both approval paths produce identical side effects (notifications, email, status update)
- [x] **Update:** `bookingLifecycle.ts` now uses `get_user_email_for_notification` RPC for robust email lookup.

---

### 🔴 MOB-PAY-003-04 — Add Realtime Subscription to `useRentalDetails`
**Type:** Feature / Bug Fix  
**Priority:** P0  
**Estimate:** 3 points  
**File:** `src/hooks/useRentalDetails.ts`

**Problem:** `useQuery` with default 5-min stale time means booking status changes are invisible until reload. When host approves, the renter's open rental details page does not update.

**Implementation:**
```ts
useEffect(() => {
  if (!id) return;
  const channel = supabase
    .channel(`booking-status-${id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookings',
      filter: `id=eq.${id}`
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['rental-details', id] });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [id, queryClient]);
```

**Acceptance Criteria:**
- [ ] When host updates booking to `awaiting_payment`, renter's open `/rental-details/:id` page re-fetches within 2 seconds
- [ ] `RentalActions` Pay Now button appears without page reload
- [ ] `PaymentDeadlineTimer` starts counting without page reload
- [ ] Channel is removed on component unmount (no memory leak)
- [ ] `queryKey: ['rental-details', id]` uses per-booking `staleTime: 0` override

---

### 🔴 MOB-PAY-003-05 — Add Realtime Subscription to `RenterBookings`
**Type:** Feature  
**Priority:** P0  
**Estimate:** 2 points  
**File:** `src/pages/RenterBookings.tsx`

**Problem:** Booking list never updates in real time. `awaiting_payment` badge and Pay Now button do not appear when host approves unless the renter manually refreshes.

**Implementation:** Supabase Realtime subscription on `bookings` filtered to `renter_id=eq.{userId}`, invalidating `['renter-bookings']` on `UPDATE`.

**Acceptance Criteria:**
- [ ] Booking card updates from "Pending" to "Awaiting Payment" badge within 2 seconds of host approval
- [ ] Pay Now button appears on the card without page reload
- [ ] Subscription scoped to current user's `renter_id` only
- [ ] `queryKey: ['renter-bookings']` uses `staleTime: 0` override
- [ ] Channel cleaned up on unmount

---

### 🟠 MOB-PAY-003-06 — Add Realtime Subscription to `HostBookings`
**Type:** Feature  
**Priority:** P1  
**Estimate:** 2 points  
**File:** `src/pages/HostBookings.tsx`

**Problem:** Hosts do not see new incoming booking requests without a page reload. This causes hosts to miss requests and let them expire.

**Acceptance Criteria:**
- [ ] New `pending` booking request appears in host list within 2 seconds of renter submission
- [ ] Status badge updates in real time (e.g., cancelled by renter before host reviews)
- [ ] Subscription scoped to `owner_id=eq.{userId}` on `bookings` table
- [ ] `queryKey: ['host-bookings']` uses `staleTime: 0` override

---

### 🟠 MOB-PAY-003-07 — Add Realtime Subscription to `NotificationsRefactored`
**Type:** Feature  
**Priority:** P1  
**Estimate:** 2 points  
**File:** `src/pages/NotificationsRefactored.tsx`

**Problem:** In-app notification bell count and list do not update in real time. Renters who miss the push notification have no live fallback to discover their booking status changed.

**Acceptance Criteria:**
- [ ] New notification appears in the list without reload
- [ ] Unread badge count on the bell icon increments in real time
- [ ] Subscription on `notifications` table filtered to `user_id=eq.{userId}`
- [ ] Channel cleaned up on unmount

---

### 🟠 MOB-PAY-003-08 — Fix Email Notification Labels at Booking Submission
**Type:** Bug Fix  
**Priority:** P1  
**Estimate:** 1 point  
**File:** `src/components/booking/BookingDialog.tsx`  
**Depends on:** MOB-PAY-003-11 (template must exist before this can call it)

**Problem:** `sendBookingConfirmation()` is called with type `'confirmed'` at lines 488 and 522 — before host approval. Per `PAYMENT_INTEGRATION_IMPLEMENTATION.md §5.1` and `20260324_EMAIL_NOTIFICATION_SYSTEM_ENHANCEMENT_PLAN.md`, confirmation emails must only fire post-payment. Additionally, there is **no renter-facing template** for the `pending` stage — this is a missing asset, not just a misfired call.

**Acceptance Criteria:**
- [x] **COMPLETED** — On booking submission (`pending`): renter receives "Booking Request Received — Awaiting Host Approval" email using the new `booking-request-received` template (MOB-PAY-003-11)
- [x] **COMPLETED** — On booking submission (`pending`): host receives "New Booking Request — Action Required" email using the existing `booking-request` template (fixed mismatch in `resend-templates.ts`)
- [ ] "Booking Confirmed" email fires **only** from `payment-webhook` Edge Function on payment success
- [x] **COMPLETED** — `sendBookingConfirmation()` call at `BookingDialog` line 488 replaced with `sendBookingRequestReceivedEmail()`
- [x] **COMPLETED** — New `sendBookingRequestReceivedEmail()` method added to `ResendEmailService` in `notificationService.ts`

---

### 🟡 MOB-PAY-003-09 — Fix `PaymentReturnPage` Polling Safety
**Type:** Bug Fix  
**Priority:** P2  
**Estimate:** 1 point  
**File:** `src/pages/PaymentReturnPage.tsx`

**Problem:** `setTimeout(checkStatus, 2000)` at line 40 has no maximum retry count. If `query-payment` returns a stuck status, the page spins indefinitely with no escape.

**Acceptance Criteria:**
- [ ] Maximum 10 retries before showing fallback UI
- [ ] Fallback UI: "Payment status unknown — view your bookings" with link to `/renter-bookings`
- [ ] Booking context (car name, dates, reference) shown on success screen
- [ ] Total polling duration capped at 20 seconds

---

### 🟡 MOB-PAY-003-10 — Override React Query `staleTime` for Booking Queries
**Type:** Improvement  
**Priority:** P2  
**Estimate:** 1 point  
**File:** `src/App.tsx`, booking query hooks

**Problem:** Global `staleTime: 5min` causes stale booking status data to persist even when the user navigates. This is correct for car listings but harmful for real-time booking status.

**Acceptance Criteria:**
- [ ] Queries with keys `['rental-details', id]`, `['renter-bookings']`, `['host-bookings']` use `staleTime: 0`
- [ ] Global config remains `staleTime: 5min` for non-critical queries
- [ ] `refetchOnWindowFocus: true` set on booking queries specifically

---

### 🟠 MOB-PAY-003-11 — Create Missing `booking-request-received` Email Template (Renter)
**Type:** New Asset — Email Template  
**Priority:** P1  
**Estimate:** 1 point  
**File:** `supabase/functions/resend-service/index.ts`

**Problem:** The `EMAIL_TEMPLATES` object in `resend-service/index.ts` has no renter-facing template for the `pending` booking stage. The following templates exist but serve the wrong purpose at this stage:
- `booking-confirmation` → correct, but for post-payment confirmed bookings only
- `booking-request` → correct for the **host**, not the renter

There is no template to tell the renter *"Your request has been sent — the host is reviewing it"*. This is the most important transactional email in the custodial booking model, and it is completely absent.

**Template to Create:** `booking-request-received`

**Template Spec:**
- **Subject:** `📋 Booking Request Sent — Awaiting Host Approval`
- **Header copy:** "Request Submitted!"
- **Body copy:** "Hi {name}, your booking request for {carBrand} {carModel} has been sent to the host. Hosts typically respond within 2 hours."
- **What happens next section (3 steps):**
  1. Host reviews your request and approves or declines
  2. You'll be notified by email and in-app when the host responds
  3. Once approved, you'll receive a payment link to confirm your booking
- **CTA button:** "View My Bookings" → `/renter-bookings`
- **Important note box:** "This is not a confirmed booking. Payment is required after host approval to secure your rental."
- **Template variables required:** `name`, `carBrand`, `carModel`, `bookingReference`, `startDate`, `endDate`, `pickupLocation`, `bookings_url`
- **Tone:** Reassuring, not confirmatory — must not use "confirmed" or "confirmed booking" language

**Acceptance Criteria:**
- [x] **COMPLETED** — `booking-request-received` key added to `EMAIL_TEMPLATES` in `resend-service/index.ts`
- [x] **COMPLETED** — Template renders correctly with all variables populated
- [x] **COMPLETED** — Template does **not** use "Confirmed" or "✅" language anywhere
- [x] **COMPLETED** — Subject line clearly sets expectation of a pending review state
- [x] **COMPLETED** — `getDefaultSubject()` in `ResendEmailService` (`notificationService.ts` line 98) updated with `'booking-request-received'` case
- [x] **COMPLETED** — New `sendBookingRequestReceivedEmail()` helper method added to `ResendEmailService` class accepting `recipient: NotificationRecipient` and `bookingData: BookingNotificationData`

---

### 🔴 MOB-PAY-003-12 — Fix Email CTA Buttons: 404 Errors from Wrong Fallback URLs
**Type:** Bug Fix  
**Priority:** P0 — Launch Blocker (currently breaking all email action flows)  
**Estimate:** 2 points  
**Files:** `supabase/functions/resend-service/index.ts`, `src/services/notificationService.ts`

**Problem:** Every CTA button in transactional emails uses an `|| fallback` URL pattern. When the calling code in `notificationService.ts` does not include the dynamic URL variable in `templateData`, the template silently falls back to a hardcoded URL. All hardcoded fallback URLs reference paths that **do not exist** in `App.tsx`, causing 404s on every click.

**Root Cause A — Wrong hardcoded fallback URLs in `resend-service/index.ts`:**

| Template | Button | Hardcoded Fallback | Actual Route | Status |
|---|---|---|---|---|
| `booking-request` | "Review Booking Request" | `/host/dashboard` | `/host-bookings` | ❌ 404 |
| `return-reminder` | "View Booking Details" | `/dashboard/bookings` | `/renter-bookings` | ❌ 404 |
| `welcome-renter` | "Browse Available Cars" | `/cars` | `/car-listing` | ❌ 404 |
| `welcome-renter` | "Join Community" | `/community` | No page exists | ❌ 404 |
| `booking-confirmation` | "Download App" CTA | `/app` | No `/app` route | ❌ 404 |
| `email-confirmation` | "Confirm Email" | `/confirm-email?token=...` | Redirects to `/login`, token lost | ❌ Broken |
| `verification-complete` (2nd copy) | "Go to Dashboard" | `/dashboard` | `/dashboard` | ✅ OK |

**Root Cause B — Dynamic URL variables never passed by callers in `notificationService.ts`:**

The `templateData` objects assembled in `sendBookingConfirmation()`, `sendPickupReminder()`, `sendReturnReminder()` etc. do not include the URL variables the templates expect (`manage_url`, `booking_url`, `dashboard_url`, `bookings_url`). So `data.manage_url` is always `undefined` at render time, the fallback fires, and the fallback is wrong.

**Example — `sendBookingConfirmation()` in `notificationService.ts` lines 188–208:**
```ts
const templateData = {
  name, bookingReference, carBrand, carModel,
  pickupDate, pickupTime, pickupLocation,
  dropoffLocation, totalAmount, customerName, hostName, carImage
  // ← manage_url / booking_url NOT included — fallback always fires
};
```

**Fix A — Correct hardcoded fallbacks** in `resend-service/index.ts`:

| Template | Variable | Replace fallback with |
|---|---|---|
| `booking-request` | `manage_url` | `https://app.mobirides.com/host-bookings` |
| `return-reminder` | `booking_url` | `https://app.mobirides.com/renter-bookings` |
| `welcome-renter` | `browse_cars_url` | `https://app.mobirides.com/car-listing` |
| `welcome-renter` | `community_url` | `https://app.mobirides.com/` |
| `booking-confirmation` | `app_url` | `https://app.mobirides.com/` |
| `email-confirmation` | fallback token path | Remove token fallback; require `confirmation_url` to be passed |

**Fix B — Pass URL variables from callers** in `notificationService.ts`:
- `sendBookingConfirmation(isHost: true)` → include `manage_url: https://app.mobirides.com/booking-requests/${bookingData.bookingId}`
- `sendBookingConfirmation(isHost: false)` → include `booking_url: https://app.mobirides.com/rental-details/${bookingData.bookingId}`
- `sendReturnReminder()` → include `booking_url: https://app.mobirides.com/rental-details/${bookingData.bookingId}`
- `sendPickupReminder()` → include `booking_url: https://app.mobirides.com/rental-details/${bookingData.bookingId}`

**Acceptance Criteria:**
- [ ] All CTA buttons in all existing email templates land on valid `app.mobirides.com` routes (no 404s)
- [ ] `booking-request` → "Review Booking Request" → `/host-bookings`
- [ ] `return-reminder` → "View Booking Details" → `/renter-bookings`
- [ ] `booking-confirmation` (host) → deep-links to `/booking-requests/:id`
- [ ] `booking-confirmation` (renter) → deep-links to `/rental-details/:id`
- [x] `awaiting-payment` → "Pay Now" → `https://app.mobirides.com/rental-details/:id` (Implemented ✅)
- [ ] `welcome-renter` → "Browse Cars" → `/car-listing`
- [ ] `email-confirmation` → `confirmation_url` always passed by caller; no broken token fallback
- [x] `BookingNotificationData` type in `notificationService.ts` updated to include optional `bookingUrl?: string` and `manageUrl?: string` fields
- [ ] Manual test: click every CTA in each template in a staging email — all resolve correctly

---

## 5. Implementation Order & Dependencies

```
MOB-PAY-003-12 (Fix email CTA 404s)                         ← independent, ship immediately — blocks all email flows
MOB-PAY-003-11 (Create booking-request-received template)   ← independent; 08 depends on it
  ↓
MOB-PAY-003-08 (Wire correct emails at booking submission)  ← depends on 11 and 12

MOB-PAY-003-03 (Unify approval paths)
  ↓ must ship before
MOB-PAY-003-04 (Realtime on useRentalDetails)   ← depends on correct status being written
MOB-PAY-003-05 (Realtime on RenterBookings)     ← parallel with 04

MOB-PAY-003-01 (Fix post-booking redirect)      ← independent, ship first
MOB-PAY-003-02 (Pay Now button in components)   ← independent, ship first

MOB-PAY-003-06 (Host realtime)                  ← after 03
MOB-PAY-003-07 (Notifications realtime)         ← independent

MOB-PAY-003-09, 10                              ← polish, ship last
```

**Sprint 13 P0 batch (ship together):** 01, 02, 03, 04, 05, 12  
**Sprint 13 P1 batch:** 06, 07, 08, 11  
**Post-Sprint polish:** 09, 10

---

## 6. Acceptance Testing Scenarios

### Scenario A — Full Happy Path (must pass before any P0 is closed)
1. Renter submits booking request → `BookingSuccessModal` shows "Request Submitted", redirects to `/renter-bookings`
2. `/renter-bookings` shows booking with "Pending" badge and "Cancel" button only
3. Host approves from list view → renter's open `/renter-bookings` updates to "Awaiting Payment" badge + "Pay Now" button **within 2 seconds, without reload**
4. Renter receives email "Your request was approved — please pay"
5. Renter taps "Pay Now" → `/rental-details/:id` → payment modal opens
6. Renter completes payment → `payment-webhook` fires → `status: confirmed` → "Booking Confirmed" email sent

### Scenario B — Renter App Closed During Approval
1. Renter submits request and closes app
2. Host approves → push notification sent to renter
3. Renter taps notification → cold launch to `/rental-details/:id` → fresh `useQuery` fetch returns `awaiting_payment` → Pay Now button visible immediately

### Scenario C — Renter on Details Page During Approval
1. Renter is on `/rental-details/:id` with status `pending`
2. Host approves → Realtime subscription fires → `queryClient.invalidateQueries` → re-fetch
3. Pay Now button appears, PaymentDeadlineTimer starts — no reload required

### Scenario D — Payment Deadline Expiry
1. Host approves, renter does not pay within 24h
2. Booking auto-cancels (existing `handleExpiredBookings` service)
3. Renter's booking card updates to "Cancelled" badge via Realtime

---

## 7. Files Modified Summary

| File | Change Type | Ticket |
|---|---|---|
| `src/components/booking/BookingDialog.tsx` | Bug fix — redirect logic, email labels | 01, 08 |
| `src/components/car-details/CarActions.tsx` | Label change — "Book Now" → "Request" | 01 |
| `src/components/booking/BookingMobileCard.tsx` | Feature — Pay Now, awaiting_payment badge | 02 |
| `src/components/booking/BookingRow.tsx` | Feature — Pay Now, awaiting_payment badge | 02 |
| `src/components/booking/RenterBookingCard.tsx` | Audit — wire to route or deprecate | 02 |
| `src/pages/HostBookings.tsx` | Bug fix — approval via lifecycle + realtime | 03, 06 |
| `src/hooks/useRentalDetails.ts` | Feature — Realtime subscription | 04 |
| `src/pages/RenterBookings.tsx` | Feature — Realtime subscription + staleTime | 05 |
| `src/pages/NotificationsRefactored.tsx` | Feature — Realtime subscription | 07 |
| `supabase/functions/resend-service/index.ts` | **COMPLETED** — Added `awaiting-payment` template & fixed URLs | 03, 11, 12 |
| `src/services/notificationService.ts` | **COMPLETED** — Added `sendPaymentRequiredEmail` & passed URL vars | 03, 08, 12 |
| `src/services/bookingLifecycle.ts` | **COMPLETED** — Wired `awaiting_payment` trigger + robust RPC lookup | 03 |
| `src/pages/PaymentReturnPage.tsx` | Bug fix — polling limit, booking context | 09 |
| `src/App.tsx` | Config — staleTime override strategy | 10 |
| `src/config/resend-templates.ts` | **COMPLETED** — Registered `awaiting_payment` template | 03, 11 |

---

## 8. Notes & Constraints

- **Do not** modify `payment-webhook/index.ts`, `initiate-payment/index.ts`, or `bookingLifecycle.ts` in this sprint. Those are governed by `20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md` and require separate PayGate/Ooze integration work.
- **Do not** change the `awaiting_payment` guard on `RentalActions.tsx` line 56 — it is correct and should remain.
- `BookingSuccessModal.tsx` is already correctly built. It only needs to be shown in the right branch of `BookingDialog`.
- All Supabase Realtime channels must use unique channel names per booking ID to avoid cross-booking subscription collisions.
- Realtime subscriptions must be tested against Supabase RLS policies to confirm the `UPDATE` event is visible to the subscribing user.
