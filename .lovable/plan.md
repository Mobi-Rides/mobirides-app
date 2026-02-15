

## Phase 3 Fixes: Real-Time Payment Deadline + Admin Transaction Atomicity

### Validation Summary

**S16 -- 24-hour payment deadline not used in UI: CONFIRMED -- NOT COMPLETE**

| Area | Current State | Gap |
|------|--------------|-----|
| `BookingWithRelations` type | Missing `payment_deadline` field | Must add `payment_deadline?: string` |
| `RenterPaymentModal` (line 112) | Hardcoded `Date.now() + 24h` | Must use `booking.payment_deadline` from DB |
| `PaymentDeadlineTimer` | Updates every 60 seconds | Must update every 1 second for real-time feel |
| `RentalDetailsRefactored` | Timer only inside modal | Must show timer on the page when status is `awaiting_payment` |
| `RenterBookingCard` | No timer shown | Must show compact timer for `awaiting_payment` bookings |
| DB column | `payment_deadline` exists as `timestamptz` | Column exists; data is written on host approval -- no DB change needed |

**S17 -- Payment deadline enforcement: CONFIRMED -- NOT COMPLETE**

| Area | Current State | Gap |
|------|--------------|-----|
| `handleExpiredBookings` (bookingService.ts) | Only expires `pending` bookings past `start_date` | Must also expire `awaiting_payment` bookings past `payment_deadline` |
| `expire-bookings` edge function | Correctly queries `awaiting_payment` + `payment_deadline` | Edge function is fine; client-side function is missing this logic |
| Caller integration | `handleExpiredBookings` is not called from RentalDetails or booking list pages | Must call on page load in RenterBookings and RentalDetailsRefactored |

**Admin Transaction Atomicity View: NOT IMPLEMENTED**

The admin Financial Dashboard has 4 siloed tabs (Ledger, Payments, Withdrawals, Insurance) with no way to trace a single booking's full financial lifecycle.

---

### Implementation Plan

#### Task 1: Add `payment_deadline` to BookingWithRelations type
- File: `src/types/booking.ts`
- Add `payment_deadline?: string` to the interface (no DB migration needed -- column already exists)

#### Task 2: Upgrade PaymentDeadlineTimer to real-time (1-second updates)
- File: `src/components/booking/PaymentDeadlineTimer.tsx`
- Change interval from 60000ms to 1000ms
- Add seconds display: `Xh Xm Xs remaining`
- Add `variant` prop: `"full"` (default, with label) and `"compact"` (just the countdown, for cards)

#### Task 3: Fix RenterPaymentModal to use actual deadline
- File: `src/components/booking/RenterPaymentModal.tsx`
- Replace line 112's hardcoded `Date.now() + 24h` with `booking.payment_deadline`
- Add fallback: if `payment_deadline` is null, use `booking.created_at + 24h`

#### Task 4: Show PaymentDeadlineTimer on RentalDetailsRefactored page
- File: `src/pages/RentalDetailsRefactored.tsx`
- When `booking.status === 'awaiting_payment'`, render `PaymentDeadlineTimer` above the action buttons using the real `booking.payment_deadline`

#### Task 5: Show compact timer on RenterBookingCard
- File: `src/components/renter-bookings/RenterBookingCard.tsx`
- When `booking.status === 'awaiting_payment'`, show a compact `PaymentDeadlineTimer` below the price line

#### Task 6: Extend handleExpiredBookings for awaiting_payment
- File: `src/services/bookingService.ts`
- Add a second query: fetch bookings with `status = 'awaiting_payment'` and `payment_deadline < now()`
- Update those to `status: 'expired'`, `payment_status: 'expired'`
- Send notification to renter about expired payment window

#### Task 7: Call handleExpiredBookings on page load
- Files: `src/pages/RenterBookings.tsx`, `src/pages/RentalDetailsRefactored.tsx`
- Call `handleExpiredBookings()` in a `useEffect` on mount so stale bookings get cleaned up when users visit these pages

#### Task 8: Admin Transaction Atomicity View
- Create `src/components/admin/finance/TransactionJourneyDialog.tsx`
  - A dialog/sheet that opens when an admin clicks a payment row
  - Shows a vertical stepper/timeline with these stages:
    1. Booking Created (date, renter, car, amount)
    2. Host Approved (date, status changed to awaiting_payment)
    3. Payment Initiated (method, provider reference)
    4. Payment Confirmed (provider response, amount received)
    5. Commission Deducted (15% amount, commission transaction ID)
    6. Host Wallet Credited (85% amount, wallet transaction ID)
    7. Earnings Released (date released or "Pending -- releases on [date]")
  - Each step shows green check if complete, grey circle if pending, red X if failed
  - Data sourced by joining `bookings`, `wallet_transactions`, `payment_transactions` (if table exists), and `commission_rates`
- Update `src/components/admin/finance/PaymentTransactionsTable.tsx` to add a "View Journey" button per row that opens the dialog

### Technical Notes
- No database migrations required -- all columns already exist
- No new edge functions needed -- the existing `expire-bookings` function already handles the server-side expiry correctly
- The client-side `handleExpiredBookings` serves as a best-effort catch for users who visit the app between cron runs

