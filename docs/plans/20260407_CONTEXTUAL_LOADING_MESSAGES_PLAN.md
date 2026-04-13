# 20260407 — Contextual Screen Loading Messages

**Date:** 2026-04-07  
**Author:** Modisa Maphanyane  
**Ticket:** S10-026  
**Priority:** P3 — UX Polish  
**Sprint:** Sprint 10

---

## Problem

Loading states across the app fall into three bad patterns:

1. **Generic bare text** — `Loading...` rendered as raw text with no styling (e.g., `HostRentalReview`, `RentalReview`, `ProtectedRoute`)
2. **Silent skeletons** — pages like `Bookings`, `RenterBookings`, `NotificationsRefactored`, and `BookingRequestDetails` show skeleton bones with **no accompanying text**, so users get no context
3. **Mismatched messages** — `LoadingView` defaults to *"Loading your profile..."* but is shown on the **home/index screen** during role detection

The existing `LoadingView` component in `src/components/home/LoadingView.tsx` already accepts an optional `message` prop and uses a branded `BarLoader`. The fix is to use that prop correctly everywhere, and replace bare `Loading...` text occurrences.

---

## Files Affected

| File | Current State | Fix |
|------|--------------|-----|
| `src/pages/Index.tsx` | `<LoadingView />` with wrong default message | Pass `message="Detecting your role..."` |
| `src/components/ProtectedRoute.tsx` | Bare `Loading...` text | Replace with `<LoadingView message="Checking authentication..." />` |
| `src/pages/HostRentalReview.tsx` | Bare `Loading...` text | Replace with `Loader2` spinner + descriptive label |
| `src/pages/RentalReview.tsx` | Bare `Loading...` text | Same pattern, message: *"Loading rental review..."* |
| `src/pages/Bookings.tsx` | Silent skeleton only | Add `"Loading your bookings..."` label above skeletons |
| `src/pages/RenterBookings.tsx` | Silent skeleton only | Add `"Fetching your rentals..."` label above skeletons |
| `src/pages/NotificationsRefactored.tsx` | Silent skeleton only | Add `"Loading notifications..."` label |
| `src/pages/BookingRequestDetails.tsx` | `animate-pulse` div, no label | Replace with `<LoadingView message="Loading booking request..." />` |

### Already Correct — No Changes Needed
- `Map.tsx` — already shows `"Validating handover..."` vs `"Loading map..."` contextually ✅
- `RentalDetailsRefactored.tsx` — uses `<RentalDetailsSkeleton />` ✅
- `ProfileView.tsx` — uses `Loader2` spinner ✅

---

## Implementation Detail

### 1. `src/pages/Index.tsx`
```tsx
// BEFORE
<LoadingView />
// AFTER
<LoadingView message="Detecting your role..." />
```

### 2. `src/components/ProtectedRoute.tsx`
```tsx
// BEFORE
<div className="flex justify-center items-center h-screen">
  Loading...
</div>

// AFTER
import { LoadingView } from "@/components/home/LoadingView";
...
<div className="flex justify-center items-center h-screen">
  <LoadingView message="Checking authentication..." />
</div>
```

### 3. `src/pages/HostRentalReview.tsx` & `RentalReview.tsx`
```tsx
// BEFORE
return <div className="container max-w-2xl py-8 flex items-center justify-center min-h-[50vh]">Loading...</div>;

// AFTER
import { Loader2 } from "lucide-react";
...
return (
  <div className="container max-w-2xl py-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">Loading review details...</p>
  </div>
);
```

### 4. `src/pages/Bookings.tsx` & `RenterBookings.tsx`
Add a label line directly after the page heading in the skeleton return block:
```tsx
<p className="text-sm text-muted-foreground px-4 -mt-2">Loading your bookings...</p>
```

### 5. `src/pages/NotificationsRefactored.tsx`
Add as first child inside the loading div:
```tsx
<p className="text-sm text-muted-foreground px-4 pt-4">Loading notifications...</p>
```

### 6. `src/pages/BookingRequestDetails.tsx`
```tsx
// BEFORE: hand-rolled animate-pulse div with no text
// AFTER:
import { LoadingView } from "@/components/home/LoadingView";
...
if (isLoading) {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Booking Request" showBackButton backTo="/host-bookings" />
      <LoadingView message="Loading booking request..." />
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] No screen in the app shows bare unstyled `Loading...` text during a loading state
- [ ] Every loading state includes a contextual label describing *what* is loading
- [ ] `tsc --noEmit` passes clean after all changes
- [ ] Manual test with Slow 3G throttle confirms all messages are visible

---

## Definition of Done

- All 8 affected files updated
- Zero new unused imports
- Verified in browser with network throttle
