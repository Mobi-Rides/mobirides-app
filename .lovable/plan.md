

# Fix: Payment Flow and Pickup Guard

## What's Wrong

Two linked bugs are preventing the payment flow from working:

### Bug 1: "Pay Now" button never appears
When a host clicks "Approve" on a booking card, the code sets the status to `awaiting_payment` but **does not set** `payment_status` or `payment_deadline`. The single-booking approval handler (line 143-146 in `HostBookings.tsx`) is missing these fields, unlike the bulk approval handler which correctly includes them.

Additionally, the `HostBookingCard` status badge config doesn't include `awaiting_payment` as a status, so approved bookings waiting for payment may display incorrectly on the host side.

### Bug 2: Renter can initiate pickup without paying
The `isPendingPickup` logic in `useRentalDetails.ts` only checks if `booking.status === 'confirmed'` -- it does **not** verify that `payment_status === 'paid'`. This means a renter can initiate a vehicle pickup even when they haven't paid.

---

## Fix Plan

### Step 1: Fix single-booking approval handler
**File:** `src/pages/HostBookings.tsx` (lines 139-146)

Update `handleBookingAction` to include `payment_status` and `payment_deadline` when approving, matching the bulk handler:

```typescript
const handleBookingAction = useCallback(async (bookingId, action) => {
  const newStatus = action === "approve" 
    ? BookingStatus.AWAITING_PAYMENT 
    : BookingStatus.CANCELLED;
  
  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: newStatus,
      ...(action === "approve" ? {
        payment_status: "unpaid",
        payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } : {})
    })
    .eq("id", bookingId);
  // ...
```

### Step 2: Add payment guard to pickup initiation
**File:** `src/hooks/useRentalDetails.ts` (line 123)

Add `payment_status === 'paid'` check to `isPendingPickup`:

```typescript
const isPendingPickup = booking && 
  booking.status === 'confirmed' && 
  booking.payment_status === 'paid' &&
  !pickupSession && 
  startDate && today >= startDate;
```

### Step 3: Add "awaiting_payment" to HostBookingCard status badges
**File:** `src/components/host-bookings/HostBookingCard.tsx` (line 57-63)

Add the missing status entry so hosts can see "Awaiting Payment" on approved bookings:

```typescript
awaiting_payment: { 
  label: "Awaiting Payment", 
  variant: "secondary" as const, 
  color: "bg-amber-100 text-amber-800" 
},
```

### Step 4: Auto-open payment modal from navigation state
**File:** `src/pages/RentalDetailsRefactored.tsx`

Read navigation state to auto-open the payment modal when arriving from a "Pay Now" click:

```typescript
useEffect(() => {
  if (location.state?.openPayment && booking?.status === 'awaiting_payment') {
    setIsPaymentModalOpen(true);
  }
}, [booking, location.state]);
```

### Step 5: Pass openPayment state from RenterBookingCard
**File:** `src/components/renter-bookings/RenterBookingCard.tsx` (line 129-136)

Update the "Pay Now" button to navigate with state:

```typescript
navigate(`/rental-details/${booking.id}`, { 
  state: { openPayment: true } 
});
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `HostBookings.tsx` | Add `payment_status` and `payment_deadline` to single approval |
| `useRentalDetails.ts` | Guard pickup behind `payment_status === 'paid'` |
| `HostBookingCard.tsx` | Add `awaiting_payment` status badge |
| `RentalDetailsRefactored.tsx` | Auto-open payment modal from nav state |
| `RenterBookingCard.tsx` | Pass `openPayment` state on "Pay Now" click |

No database migrations needed -- the columns (`payment_status`, `payment_deadline`) already exist on the `bookings` table.

