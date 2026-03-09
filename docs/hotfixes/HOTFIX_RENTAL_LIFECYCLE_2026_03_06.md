# HOTFIX: Rental Lifecycle Critical Failures

**Date:** March 6, 2026  
**Epic:** MOB-200 — Rental Lifecycle Hotfix  
**Priority:** P0 (Critical)  
**Status:** Ready for Implementation  
**Triggered By:** Failed Mazda rental — destination pricing lost, navigation broken, payment didn't fire, pickup handover duplicated, return handover didn't trigger, reviews never appeared  
**Related:** [HOTFIX_ADMIN_PORTAL_2026_02_24.md](./HOTFIX_ADMIN_PORTAL_2026_02_24.md) (Epic MOB-100)

---

## Executive Summary

A complete rental lifecycle test (Mazda booking → payment → pickup → navigation → return → review) exposed **7 distinct failures** spanning database schema gaps, missing status transitions, broken routing, fragile state management, and absent UI feedback. Every failure after the booking stage cascaded from a single root cause: **no booking status transition after pickup handover**.

### Failure Chain

```
Booking Created (✅ confirmed)
  → Destination surcharge calculated but NOT persisted (MOB-201/209)
  → Host approves → status: awaiting_payment (✅)
    → Payment modal auto-open lost on navigation (MOB-208)
    → Payment completed → status: confirmed (✅)
      → Pickup handover completed (✅)
        → ❌ Booking status stays 'confirmed' (should be 'in_progress') ← ROOT CAUSE
          → Map rejects booking for return (MOB-206)
          → Return handover button never appears (MOB-205)
          → Map redirects away from handover sheet (MOB-207)
          → Return never completes → status never reaches 'completed'
            → Review/rating triggers never fire (MOB-212)
```

---

## Ticket Index

| Ticket | Title | Priority | Effort | Section |
|--------|-------|----------|--------|---------|
| MOB-201 | Add `destination_type` column to bookings | P1 | XS | A: Database |
| MOB-202 | Pickup handover → set booking `in_progress` | P0 | S | B: Backend Logic |
| MOB-203 | ResizableHandoverTray missing return status update | P0 | XS | B: Backend Logic |
| MOB-204 | Prevent duplicate handover session creation | P1 | S | B: Backend Logic |
| MOB-205 | HandoverBookingButtons only queries `confirmed` | P0 | XS | B: Backend Logic |
| MOB-206 | Map.tsx validateBooking rejects `in_progress` | P0 | XS | C: Frontend Logic |
| MOB-207 | Map.tsx return handover redirects away from map | P0 | S | C: Frontend Logic |
| MOB-208 | Payment auto-open uses fragile `location.state` | P1 | S | C: Frontend Logic |
| MOB-209 | BookingDialog doesn't persist `destination_type` | P1 | XS | C: Frontend Logic |
| MOB-210 | Destination type missing from Step 4 review | P1 | XS | D: UI/UX |
| MOB-211 | RentalPaymentDetails missing surcharge line | P2 | S | D: UI/UX |
| MOB-212 | RenterBookingCard lacks active/return states | P2 | S | D: UI/UX |

---

## Implementation Phases

```
Phase 1 — Blockers (P0):    MOB-201 → MOB-202 → MOB-203 → MOB-205 → MOB-206 → MOB-207
Phase 2 — Regressions (P1): MOB-204 → MOB-208 → MOB-209
Phase 3 — UI/UX (P2):       MOB-210 → MOB-211 → MOB-212
```

---

## Section A: Database Migration

### MOB-201 — Add `destination_type` column to bookings table

**Priority:** P1  
**Effort:** XS  
**Type:** Migration  
**Depends On:** None  
**Blocks:** MOB-209, MOB-210, MOB-211

#### Problem

The `DestinationTypeSelector` component calculates surcharges (local: 0%, out-of-zone: +50%, cross-border: +100%) client-side via `useDynamicPricing`, but the selected destination type is never stored. After booking creation, the surcharge information is permanently lost.

#### Current State

```typescript
// BookingDialog.tsx — booking insert (lines 343-362)
const { data: booking } = await supabase.from("bookings").insert({
  car_id, renter_id, start_date, end_date, start_time, end_time,
  total_price, status: "pending",
  // ❌ destination_type is NOT included
}).select().single();
```

#### Ideal State

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS destination_type TEXT 
DEFAULT 'local' 
CHECK (destination_type IN ('local', 'out_of_zone', 'cross_border'));
```

#### Migration Process

1. Create migration file: `YYYYMMDDHHMMSS_add_destination_type_and_handover_guard.sql`
2. Combined with MOB-204 partial unique index (single migration)
3. Run 5-point Migration Impact Checklist
4. Regenerate Supabase types after migration applied
5. Verify `BookingWithRelations` type compatibility

#### Acceptance Criteria

- [ ] Column exists on `bookings` table with default `'local'`
- [ ] CHECK constraint prevents invalid values
- [ ] Existing bookings default to `'local'`
- [ ] Supabase types regenerated and `destination_type` appears in `Database['public']['Tables']['bookings']`

---

## Section B: Backend Logic Fixes

### MOB-202 — Pickup handover completion must transition booking to `in_progress`

**Priority:** P0 (Root Cause)  
**Effort:** S  
**Type:** Logic Fix  
**Depends On:** None  
**Blocks:** MOB-205, MOB-206, MOB-207 (cascading fix)

#### Problem

Neither `EnhancedHandoverSheet` nor `ResizableHandoverTray` updates the booking status after pickup handover completion. The `completeHandover` service only sets `handover_completed = true` on the session record. The booking remains `confirmed` indefinitely, breaking every downstream flow.

#### Current State

```typescript
// EnhancedHandoverSheet.tsx — handleHandoverComplete (lines 402-418)
const handleHandoverComplete = async () => {
  await completeHandover(handoverId);
  // Only updates booking status on RETURN handover:
  if (isReturnHandover()) {
    await supabase.from('bookings').update({ 
      status: 'completed', 
      actual_end_date: new Date().toISOString() 
    }).eq('id', bookingId);
  }
  // ❌ No status update for PICKUP handover
};
```

#### Ideal State

```typescript
const handleHandoverComplete = async () => {
  await completeHandover(handoverId);
  if (isReturnHandover()) {
    await supabase.from('bookings').update({ 
      status: 'completed', 
      actual_end_date: new Date().toISOString() 
    }).eq('id', bookingId);
  } else {
    // ✅ NEW: Transition to in_progress after pickup
    await supabase.from('bookings').update({ 
      status: 'in_progress' 
    }).eq('id', bookingId);
  }
};
```

#### Files to Modify

- `src/components/handover/EnhancedHandoverSheet.tsx` — `handleHandoverComplete`
- `src/components/handover/ResizableHandoverTray.tsx` — `handleHandoverComplete`

#### Mobile-First Considerations

- Toast notification on pickup completion: "Rental started! Your booking is now active."
- Toast uses `sonner` with mobile-friendly positioning (bottom center)

#### Acceptance Criteria

- [ ] After pickup handover completion, `bookings.status` = `'in_progress'`
- [ ] After return handover completion, `bookings.status` = `'completed'`
- [ ] Both `EnhancedHandoverSheet` and `ResizableHandoverTray` have the same logic
- [ ] Success toast displayed on mobile

---

### MOB-203 — ResizableHandoverTray missing return booking status update

**Priority:** P0  
**Effort:** XS  
**Type:** Logic Fix  
**Depends On:** None  
**Blocks:** None

#### Problem

`ResizableHandoverTray` only calls `completeHandover()` and creates a condition report on completion. Unlike `EnhancedHandoverSheet`, it does **not** update booking status to `completed` on return handover. If the tray component is used instead of the sheet (e.g., on larger screens), the return never registers.

#### Current State

```typescript
// ResizableHandoverTray.tsx — handleHandoverComplete (lines 190-230)
const handleHandoverComplete = async () => {
  await completeHandover(handoverId);
  // Creates vehicle condition report
  // ❌ Does NOT update booking status for return
};
```

#### Ideal State

```typescript
const handleHandoverComplete = async () => {
  await completeHandover(handoverId);
  if (isReturnHandover()) {
    await supabase.from('bookings').update({ 
      status: 'completed', 
      actual_end_date: new Date().toISOString() 
    }).eq('id', bookingId);
  } else {
    await supabase.from('bookings').update({ 
      status: 'in_progress' 
    }).eq('id', bookingId);
  }
};
```

#### Acceptance Criteria

- [ ] `ResizableHandoverTray` has feature parity with `EnhancedHandoverSheet` for status updates
- [ ] Both pickup and return transitions work correctly

---

### MOB-204 — Prevent duplicate handover session creation

**Priority:** P1  
**Effort:** S  
**Type:** Logic Fix + Migration  
**Depends On:** MOB-201 (shared migration file)  
**Blocks:** None

#### Problem

`HandoverContext.tsx` calls `createHandoverSession` when no existing session is found for the determined handover type. If the context re-renders or the type detection logic fluctuates between `pickup` and `return`, duplicate sessions are created for the same booking. This caused the pickup handover to be performed twice.

#### Current State

```typescript
// HandoverContext.tsx — fetchOrCreateHandoverSession
useEffect(() => {
  const session = await fetchHandoverSession(bookingId, handoverType);
  if (!session) {
    await createHandoverSession(bookingId, handoverType, ...);
    // ❌ No guard against duplicates. Re-renders can trigger this again.
  }
}, [bookingId, handoverType]);
```

#### Fix — Two-Part

**Part 1: Database Guard (in shared migration)**

```sql
-- Partial unique index: only one active session per booking per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_handover_session 
ON handover_sessions (booking_id, handover_type) 
WHERE handover_completed = false;
```

**Part 2: Application Guard**

```typescript
// HandoverContext.tsx
const fetchOrCreateHandoverSession = async () => {
  // Check for ANY existing session (completed or not) of this type
  const { data: existing } = await supabase
    .from('handover_sessions')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('handover_type', handoverType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    setHandoverSession(existing);
    return;
  }

  // Only create if truly no session exists
  const { data: newSession } = await createHandoverSession(...);
  setHandoverSession(newSession);
};
```

#### Acceptance Criteria

- [ ] Partial unique index prevents duplicate active sessions at DB level
- [ ] Application-level guard prevents unnecessary creation calls
- [ ] Existing duplicate sessions handled gracefully (use most recent)

---

### MOB-205 — HandoverBookingButtons only queries `status = 'confirmed'`

**Priority:** P0  
**Effort:** XS  
**Type:** Logic Fix  
**Depends On:** MOB-202 (status must transition first)  
**Blocks:** None

#### Problem

`HandoverBookingButtons.tsx` line 62 filters bookings with `.eq("status", "confirmed")`. After MOB-202 transitions pickup bookings to `in_progress`, the return handover buttons will never appear because the query excludes `in_progress` bookings.

#### Current State

```typescript
// HandoverBookingButtons.tsx (line 62)
const { data: bookings } = await supabase
  .from("bookings")
  .select("*, cars(*)")
  .eq("status", "confirmed")  // ❌ Misses in_progress
  .or(`renter_id.eq.${userId},cars.owner_id.eq.${userId}`);
```

#### Ideal State

```typescript
const { data: bookings } = await supabase
  .from("bookings")
  .select("*, cars(*)")
  .in("status", ["confirmed", "in_progress"])  // ✅ Includes active rentals
  .or(`renter_id.eq.${userId},cars.owner_id.eq.${userId}`);
```

#### Additional Fix — Return Detection (lines 87-106)

The `needsReturn` filter should verify that the pickup session is completed before showing the return button:

```typescript
const needsReturn = bookings.filter(b => {
  const isEndDate = isToday(parseISO(b.end_date)) || isPast(parseISO(b.end_date));
  const isActive = b.status === 'in_progress';  // ✅ Use status instead of date-only check
  return isActive && isEndDate;
});
```

#### Acceptance Criteria

- [ ] Return handover buttons appear for `in_progress` bookings on/after end date
- [ ] Pickup handover buttons still appear for `confirmed` bookings

---

## Section C: Frontend Logic & Routing Fixes

### MOB-206 — Map.tsx validateBooking rejects non-confirmed bookings

**Priority:** P0  
**Effort:** XS  
**Type:** Logic Fix  
**Depends On:** MOB-202  
**Blocks:** None

#### Problem

`Map.tsx` line 68 validates the booking with `.eq('status', 'confirmed')`. After pickup transitions the booking to `in_progress`, the map page rejects it entirely — "Booking not found" — breaking return handover navigation.

#### Current State

```typescript
// Map.tsx (line 68)
const { data: booking } = await supabase
  .from('bookings')
  .select('*')
  .eq('id', bookingId)
  .eq('status', 'confirmed')  // ❌ Rejects in_progress
  .single();
```

#### Ideal State

```typescript
const { data: booking } = await supabase
  .from('bookings')
  .select('*')
  .eq('id', bookingId)
  .in('status', ['confirmed', 'in_progress'])  // ✅ Accepts active rentals
  .single();
```

#### Acceptance Criteria

- [ ] Map page loads for both `confirmed` and `in_progress` bookings
- [ ] Invalid statuses (cancelled, completed, expired) still rejected

---

### MOB-207 — Map.tsx return handover redirects away from map

**Priority:** P0  
**Effort:** S  
**Type:** Logic Fix  
**Depends On:** None  
**Blocks:** None

#### Problem

`Map.tsx` lines 384-388 detect a return handover click and redirect the user to `/rental-details/${bookingId}` via `window.location.href`. This completely breaks the map-based return handover flow — the user lands on the details page instead of the `EnhancedHandoverSheet` opening on the map.

#### Current State

```typescript
// Map.tsx (lines 384-388)
if (handoverType === 'return') {
  window.location.href = `/rental-details/${bookingId}`;  // ❌ Breaks flow
  return;
}
```

#### Ideal State

```typescript
// Remove the redirect entirely. Let returns use the EnhancedHandoverSheet
// on the map page, same as pickups. The handoverType URL param controls
// which type of handover session is created/resumed.
// ✅ No redirect — sheet opens on map for both pickup and return
```

#### Acceptance Criteria

- [ ] Return handover opens `EnhancedHandoverSheet` on the map page
- [ ] `handoverType=return` URL param is passed and correctly detected
- [ ] Navigation/directions still work for return trips

---

### MOB-208 — Payment modal auto-open uses fragile `location.state`

**Priority:** P1  
**Effort:** S  
**Type:** Logic Fix  
**Depends On:** None  
**Blocks:** None

#### Problem

"Pay Now" in `RenterBookingCard` navigates with `{ state: { openPayment: true } }`. The receiving page (`RentalDetailsRefactored`) reads `location.state?.openPayment` in a `useEffect`. This state is lost on page refresh, deep linking, or if the booking data loads asynchronously after the effect fires.

#### Current State

```typescript
// RenterBookingCard.tsx (line 135)
navigate(`/rental-details/${booking.id}`, { state: { openPayment: true } });

// RentalDetailsRefactored.tsx (lines 69-72)
useEffect(() => {
  if (location.state?.openPayment && booking?.status === 'awaiting_payment') {
    setIsPaymentModalOpen(true);
  }
}, [booking, location.state]);
// ❌ If booking loads after location.state is consumed, modal never opens
```

#### Ideal State

```typescript
// RenterBookingCard.tsx
navigate(`/rental-details/${booking.id}?pay=true`);

// RentalDetailsRefactored.tsx
const [searchParams, setSearchParams] = useSearchParams();
useEffect(() => {
  if (searchParams.get('pay') === 'true' && booking?.status === 'awaiting_payment') {
    setIsPaymentModalOpen(true);
    searchParams.delete('pay');
    setSearchParams(searchParams, { replace: true });
  }
}, [booking, searchParams]);
```

#### Mobile-First Considerations

- URL params survive app switches, background/foreground cycles, and pull-to-refresh on mobile browsers
- `replace: true` prevents back-button re-triggering the modal

#### Acceptance Criteria

- [ ] "Pay Now" uses URL param `?pay=true` instead of navigation state
- [ ] Modal opens reliably even on slow connections (waits for booking data)
- [ ] Param cleared after modal opens (no re-trigger on refresh)
- [ ] Back button doesn't re-open modal

---

### MOB-209 — BookingDialog doesn't persist `destination_type`

**Priority:** P1  
**Effort:** XS  
**Type:** Logic Fix  
**Depends On:** MOB-201 (column must exist)  
**Blocks:** MOB-210, MOB-211

#### Problem

The booking insert in `BookingDialog.tsx` omits `destination_type`. The value is calculated and displayed in the UI during booking creation but never saved.

#### Current State

```typescript
// BookingDialog.tsx (lines 343-362)
const { data: booking } = await supabase.from("bookings").insert({
  car_id, renter_id, start_date, end_date, start_time, end_time,
  total_price, status: "pending",
  base_rental_price, dynamic_pricing_multiplier,
  insurance_premium, insurance_policy_id,
  promo_code_id, discount_amount,
  // ❌ destination_type NOT included
}).select().single();
```

#### Ideal State

```typescript
const { data: booking } = await supabase.from("bookings").insert({
  car_id, renter_id, start_date, end_date, start_time, end_time,
  total_price, status: "pending",
  base_rental_price, dynamic_pricing_multiplier,
  insurance_premium, insurance_policy_id,
  promo_code_id, discount_amount,
  destination_type: destinationType,  // ✅ Persisted
}).select().single();
```

#### Acceptance Criteria

- [ ] `destination_type` saved on every new booking
- [ ] Defaults to `'local'` if selector not interacted with
- [ ] Value readable in rental details and payment summaries

---

## Section D: Frontend UI/UX (Mobile-First)

### MOB-210 — Destination type missing from Step 4 review summary

**Priority:** P1  
**Effort:** XS  
**Type:** UI Enhancement  
**Depends On:** MOB-209 (must be persisted to be meaningful)  
**Blocks:** None

#### Problem

Step 4 (Booking Review) in `BookingDialog.tsx` (lines 857-908) shows dates, pickup location, promo code, and price summary — but does not show the selected destination type or its surcharge.

#### Current State

```
┌─────────────────────────────┐
│ Booking Review              │
│ ─────────────────────────── │
│ Dates: Mar 10 - Mar 12      │
│ Pickup: Gaborone CBD         │
│ Promo: FIRST10 (-P50)       │
│ Total: P1,500               │
│ ❌ No destination type shown │
└─────────────────────────────┘
```

#### Ideal State (Mobile-First)

```
┌─────────────────────────────┐
│ Booking Review              │
│ ─────────────────────────── │
│ Dates: Mar 10 - Mar 12      │
│ Pickup: Gaborone CBD         │
│ Trip Type: Out of Zone       │
│            ┌──────────┐     │
│            │ +50%     │     │
│            └──────────┘     │
│ Promo: FIRST10 (-P50)       │
│ Total: P1,500               │
└─────────────────────────────┘
```

#### Implementation

- Add row between "Pickup" and "Promo" sections
- Left: "Trip Type" label (`text-sm text-muted-foreground`)
- Right: Destination label + surcharge badge
- Badge colors: Local = `bg-secondary`, Out of Zone = `bg-orange-500/10 text-orange-600`, Cross Border = `bg-destructive/10 text-destructive`
- Only show surcharge badge if not `local`

#### Acceptance Criteria

- [ ] Destination type visible in Step 4 review
- [ ] Surcharge percentage shown as badge when applicable
- [ ] Layout consistent with existing review rows
- [ ] Responsive on 320px–414px viewport widths

---

### MOB-211 — RentalPaymentDetails missing destination surcharge line item

**Priority:** P2  
**Effort:** S  
**Type:** UI Enhancement  
**Depends On:** MOB-201, MOB-209  
**Blocks:** None

#### Problem

`RentalPaymentDetails.tsx` shows base price, dynamic pricing multiplier, insurance premium, and discount — but no destination surcharge line item. After MOB-209 persists the destination type, this component should display it.

#### Current State

```
┌─────────────────────────────┐
│ Price Breakdown             │
│ ─────────────────────────── │
│ Base (3 days × P500)  P1,500│
│ Dynamic Pricing (×1.2) P300 │
│ Insurance Premium      P150 │
│ Discount (FIRST10)    -P50  │
│ ─────────────────────────── │
│ Total                P1,900 │
│ ❌ No destination surcharge  │
└─────────────────────────────┘
```

#### Ideal State (Mobile-First)

```
┌─────────────────────────────┐
│ Price Breakdown             │
│ ─────────────────────────── │
│ Base (3 days × P500)  P1,500│
│ Out of Zone (+50%)     P750 │  ← NEW
│ Dynamic Pricing (×1.2) P300 │
│ Insurance Premium      P150 │
│ Discount (FIRST10)    -P50  │
│ ─────────────────────────── │
│ Total                P2,650 │
└─────────────────────────────┘
```

#### Implementation

- Read `booking.destination_type` from the booking record
- If `out_of_zone`: show "+50%" with calculated amount
- If `cross_border`: show "+100%" with calculated amount
- If `local` or `null`: hide the line entirely
- Use same flex row layout as existing lines (`text-sm`, `justify-between`)
- Label color: `text-muted-foreground`, value: `text-foreground`

#### Acceptance Criteria

- [ ] Surcharge line item appears when destination type is not `local`
- [ ] Amount calculated correctly from base price
- [ ] Hidden for local trips (no visual noise)
- [ ] Consistent with existing price breakdown styling

---

### MOB-212 — RenterBookingCard lacks in-progress and return-ready states

**Priority:** P2  
**Effort:** S  
**Type:** UI Enhancement  
**Depends On:** MOB-202 (status must transition to enable these states)  
**Blocks:** None

#### Problem

`RenterBookingCard.tsx` only renders actions for: `completed` (Review), `awaiting_payment` (Pay Now), `pending` (Cancel). There are no visual states or actions for `in_progress` (active rental) or return-ready bookings (in_progress + on/after end date).

#### Current State

| Status | Badge | Action |
|--------|-------|--------|
| pending | "Pending" (yellow) | Cancel |
| confirmed | "Confirmed" (green) | — |
| awaiting_payment | "Awaiting Payment" (orange) | Pay Now |
| completed | "Completed" (blue) | Write Review |
| cancelled | "Cancelled" (red) | — |
| ❌ in_progress | Not handled | Not handled |

#### Ideal State (Mobile-First)

| Status | Badge | Action |
|--------|-------|--------|
| pending | "Pending" (yellow) | Cancel |
| confirmed | "Confirmed" (green) | — |
| awaiting_payment | "Awaiting Payment" (orange) | Pay Now |
| in_progress | **"Active" (green pulse)** | — |
| in_progress + end date reached | **"Return Due" (orange)** | **Return Vehicle** |
| completed | "Completed" (blue) | Write Review |
| cancelled | "Cancelled" (red) | — |

#### Implementation

```tsx
// New status badges
{booking.status === 'in_progress' && (
  isReturnDue ? (
    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
      Return Due
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 animate-pulse">
      Active
    </Badge>
  )
)}

// Return Vehicle button (mobile-first: full width, prominent)
{booking.status === 'in_progress' && isReturnDue && (
  <Button 
    size="sm" 
    className="w-full"
    onClick={() => navigate(`/map?bookingId=${booking.id}&handoverType=return`)}
  >
    <CarFront className="h-3 w-3 mr-1" />
    Return Vehicle
  </Button>
)}
```

#### Mobile-First Considerations

- "Active" badge uses subtle `animate-pulse` to draw attention without being distracting
- "Return Vehicle" button is full-width on mobile (`w-full`) for easy tap target
- Button uses `size="sm"` consistent with existing card actions
- Icon size `h-3 w-3` matches existing card icon sizes

#### Acceptance Criteria

- [ ] "Active" badge shown for `in_progress` bookings before end date
- [ ] "Return Due" badge shown for `in_progress` bookings on/after end date
- [ ] "Return Vehicle" button navigates to map with correct params
- [ ] Touch target minimum 44px height on mobile
- [ ] Consistent with existing card styling

---

## Migration File Template

**Filename:** `YYYYMMDDHHMMSS_add_destination_type_and_handover_guard.sql`

```sql
-- MOB-201: Add destination_type to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS destination_type TEXT 
DEFAULT 'local' 
CHECK (destination_type IN ('local', 'out_of_zone', 'cross_border'));

-- MOB-204: Prevent duplicate active handover sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_handover_session 
ON handover_sessions (booking_id, handover_type) 
WHERE handover_completed = false;
```

### 5-Point Migration Impact Checklist

- [ ] **RLS Impact:** No new RLS policies needed — inherits existing `bookings` and `handover_sessions` policies
- [ ] **Type Regeneration:** Run Supabase type generation after migration. Verify `destination_type` in `types.ts`
- [ ] **Default Values:** All existing bookings default to `'local'` — safe backfill
- [ ] **Index Performance:** Partial unique index is lightweight — only applies to active sessions
- [ ] **Rollback Plan:** `ALTER TABLE bookings DROP COLUMN destination_type; DROP INDEX idx_unique_active_handover_session;`

---

## Testing Plan

### End-to-End Lifecycle Test

After all fixes applied, verify the complete flow:

```
1. Browse cars → Select Mazda → Book with "Out of Zone" destination
   ✅ Verify: destination_type = 'out_of_zone' in DB
   ✅ Verify: Step 4 shows "Trip Type: Out of Zone (+50%)"

2. Host approves → Status: awaiting_payment
   ✅ Verify: Payment modal opens via URL param

3. Complete payment → Status: confirmed
   ✅ Verify: Booking card shows "Confirmed"

4. Navigate to map → Start pickup handover
   ✅ Verify: Handover sheet opens on map
   ✅ Verify: Only ONE handover session created

5. Complete pickup handover
   ✅ Verify: Status transitions to 'in_progress'
   ✅ Verify: Booking card shows "Active" badge
   ✅ Verify: Toast: "Rental started!"

6. On/after end date → Return vehicle
   ✅ Verify: Booking card shows "Return Due" + "Return Vehicle" button
   ✅ Verify: Map page loads (accepts in_progress status)
   ✅ Verify: Return handover sheet opens (no redirect)

7. Complete return handover
   ✅ Verify: Status transitions to 'completed'
   ✅ Verify: Review page appears automatically
   ✅ Verify: Booking card shows "Write Review" action

8. Submit review
   ✅ Verify: Review saved, rating visible
```

### Regression Tests

- [ ] Existing `confirmed` bookings still work on map page
- [ ] Cancellation flow unaffected
- [ ] Host booking cards unaffected by new statuses
- [ ] Payment modal doesn't re-open on page refresh (param cleared)
- [ ] No duplicate handover sessions created on rapid re-renders

---

## Files Modified (Summary)

| File | Tickets |
|------|---------|
| `supabase/migrations/YYYYMMDD_add_destination_type_and_handover_guard.sql` | MOB-201, MOB-204 |
| `src/components/handover/EnhancedHandoverSheet.tsx` | MOB-202 |
| `src/components/handover/ResizableHandoverTray.tsx` | MOB-202, MOB-203 |
| `src/contexts/HandoverContext.tsx` | MOB-204 |
| `src/components/handover/HandoverBookingButtons.tsx` | MOB-205 |
| `src/pages/Map.tsx` | MOB-206, MOB-207 |
| `src/components/renter-bookings/RenterBookingCard.tsx` | MOB-208, MOB-212 |
| `src/pages/RentalDetailsRefactored.tsx` | MOB-208 |
| `src/components/booking/BookingDialog.tsx` | MOB-209, MOB-210 |
| `src/components/rental-details/RentalPaymentDetails.tsx` | MOB-211 |

---

## Document References

| Document | Relevance |
|----------|-----------|
| `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` | Prior hotfix (MOB-100), same format |
| `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md` | Payment flow and status transitions |
| `docs/INSURANCE_README.md` | Insurance integration with booking flow |
| `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md` | Current test coverage |
| `docs/Product Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md` | Latest status metrics |
