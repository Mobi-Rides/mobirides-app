# MobiRides Launch Campaign Implementation Plan

**Version:** 1.0  
**Date:** December 4, 2025  
**Status:** Implementation Ready  
**Related:** mobirdes-launch-communications-plan-2025-11-05.pdf

---

## Executive Summary

This document outlines the technical implementation plan for features required to support the MobiRides Launch Communications Plan. It focuses on the promo code system (critical for the "FIRST100" campaign), user-facing promo code history, car views tracking, host calendar enhancements, and chat improvements.

---

## Table of Contents

1. [Feature Gap Analysis](#1-feature-gap-analysis)
2. [Phase 1: Promo Code System (CRITICAL)](#2-phase-1-promo-code-system-critical)
3. [Phase 2: Promo Code History UI](#3-phase-2-promo-code-history-ui)
4. [Phase 3: Car Views Tracking](#4-phase-3-car-views-tracking)
5. [Phase 4: Host Calendar Enhancement](#5-phase-4-host-calendar-enhancement)
6. [Phase 5: Chat Enhancements](#6-phase-5-chat-enhancements)
7. [Database Migrations](#7-database-migrations)
8. [Testing Checklist](#8-testing-checklist)
9. [Rollout Timeline](#9-rollout-timeline)

---

## 1. Feature Gap Analysis

### Campaign Requirements vs Current State

| Feature | Campaign Need | Current State | Priority |
|---------|---------------|---------------|----------|
| Promo Code System | "FIRST100" P100 OFF | ❌ Not implemented | CRITICAL |
| Promo Code History | User redemption tracking | ❌ Not implemented | HIGH |
| Car View Count | Show listing popularity | ⚠️ Type exists, not in DB | MEDIUM |
| Host Calendar View | Availability management | ⚠️ Basic calendar only | MEDIUM |
| "Active Now" Chat | Real-time availability | ⚠️ Online status exists | LOW |
| Quick Replies | Common message templates | ❌ Not implemented | LOW |

---

## 2. Phase 1: Promo Code System (CRITICAL)

### 2.1 Database Schema

#### Table: `promo_codes`

```sql
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  terms_conditions TEXT,
  min_booking_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  applicable_vehicle_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promo codes
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
```

#### Table: `promo_code_usage`

```sql
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id) -- One use per user per code
);

-- Enable RLS
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own promo usage
CREATE POLICY "Users can view their own promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own promo usage
CREATE POLICY "Users can insert their own promo usage"
  ON public.promo_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all promo usage
CREATE POLICY "Admins can view all promo usage"
  ON public.promo_code_usage FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));
```

### 2.2 Service Layer

#### File: `src/services/promoCodeService.ts`

```typescript
interface PromoCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
  terms_conditions: string | null;
  min_booking_amount: number | null;
}

interface PromoCodeValidation {
  valid: boolean;
  error?: string;
  discount?: number;
  promoCode?: PromoCode;
}

// Functions to implement:
export async function validatePromoCode(
  code: string, 
  userId: string, 
  bookingAmount: number
): Promise<PromoCodeValidation>

export async function applyPromoCode(
  promoCodeId: string, 
  userId: string, 
  bookingId: string, 
  discountApplied: number,
  originalAmount: number,
  finalAmount: number
): Promise<void>

export async function getAvailablePromoCodes(userId: string): Promise<PromoCode[]>

export async function getUserPromoCodeHistory(userId: string): Promise<PromoCodeUsage[]>

export function calculateDiscount(promoCode: PromoCode, bookingAmount: number): number
```

### 2.3 Booking Flow Integration

#### Update: `src/components/booking/BookingDialog.tsx`

- Add promo code input field below price breakdown
- Add "Apply" button with validation feedback
- Show discount line item in price summary when valid code applied
- Store `promo_code_id` in booking creation payload

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Price Breakdown                     │
├─────────────────────────────────────┤
│ Daily Rate: P1,500 × 3 days         │
│ Subtotal:               P4,500.00   │
│ Service Fee:              P450.00   │
│ ─────────────────────────────────── │
│ Promo Code: [FIRST100    ] [Apply]  │
│ ✓ Code applied! -P100.00            │
│ ─────────────────────────────────── │
│ Total:                  P4,850.00   │
└─────────────────────────────────────┘
```

### 2.4 Seed FIRST100 Campaign Code

```sql
INSERT INTO public.promo_codes (
  code, 
  discount_amount, 
  discount_type, 
  max_uses, 
  description,
  terms_conditions,
  valid_until
) VALUES (
  'FIRST100', 
  100, 
  'fixed', 
  500, 
  'First 500 renters get P100 off their first booking!',
  'Valid for first-time bookings only. Cannot be combined with other offers. One use per user.',
  '2025-12-31 23:59:59+00'
);
```

---

## 3. Phase 2: Promo Code History UI

### 3.1 Component Architecture

```
src/
├── pages/
│   └── PromoCodeHistory.tsx           # Main page
├── components/
│   └── promo/
│       ├── PromoCodeCard.tsx          # Individual code display
│       ├── PromoCodeSummary.tsx       # Savings summary
│       ├── PromoCodeTabs.tsx          # Available/Used/Expired tabs
│       └── PromoCodeInput.tsx         # Reusable input for booking
└── hooks/
    └── usePromoCodeHistory.ts         # Data fetching hook
```

### 3.2 Page: `src/pages/PromoCodeHistory.tsx`

**Features:**
- Header with back navigation and page title "Rewards & Discounts"
- Summary card showing total savings at top
- Three tabs: Available, Used, Expired
- Pull-to-refresh functionality
- Empty states for each tab with helpful messaging

### 3.3 Component: `src/components/promo/PromoCodeCard.tsx`

**Props:**
```typescript
interface PromoCodeCardProps {
  code: string;
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  description?: string;
  validUntil?: string;
  status: 'available' | 'used' | 'expired';
  usedAt?: string;
  savedAmount?: number;
}
```

**Features:**
- Code display with copy-to-clipboard button
- Discount badge (e.g., "P100 OFF" or "10% OFF")
- Validity date display with countdown for expiring soon
- Status indicator (color-coded: green=available, gray=used, red=expired)
- Terms & conditions expandable section
- "Use Now" button for available codes → navigates to car search

### 3.4 Component: `src/components/promo/PromoCodeSummary.tsx`

**Display:**
- Total codes available count with badge
- Total codes used count
- Total savings amount (e.g., "You've saved P350!")
- Celebration animation when savings > 0

### 3.5 Hook: `src/hooks/usePromoCodeHistory.ts`

```typescript
interface UsePromoCodeHistoryReturn {
  availableCodes: PromoCode[];
  usedCodes: PromoCodeUsage[];
  expiredCodes: PromoCode[];
  totalSavings: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePromoCodeHistory(): UsePromoCodeHistoryReturn
```

### 3.6 Profile Menu Integration

#### Update: `src/components/profile/ProfileMenu.tsx`

Add new menu item in "Vehicle & Bookings" section:
```typescript
{
  icon: Ticket, // from lucide-react
  label: "Rewards & Discounts",
  onClick: () => navigate("/promo-codes"),
  description: "View promo codes and savings",
  badge: availableCodesCount > 0 ? availableCodesCount : undefined
}
```

### 3.7 Route Registration

#### Update: `src/App.tsx`
```typescript
<Route path="/promo-codes" element={<PromoCodeHistory />} />
```

---

## 4. Phase 3: Car Views Tracking

### 4.1 Database Changes

```sql
-- Add view_count to cars table
ALTER TABLE public.cars ADD COLUMN view_count INTEGER DEFAULT 0;

-- Create atomic increment function
CREATE OR REPLACE FUNCTION increment_car_view_count(car_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.cars 
  SET view_count = view_count + 1 
  WHERE id = car_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Frontend Integration

#### Update: `src/pages/CarDetails.tsx`
- Call increment function on page load
- Add debounce/throttle to prevent abuse (max 1 view per session per car)
- Exclude owner's own views from count

#### Update: `src/components/host/HostCarCard.tsx`
- Display view count with eye icon: "👁 245 views"
- Show trend indicator if data available (up/down from last period)

### 4.3 Service Layer

#### File: `src/services/carViewsService.ts`

```typescript
export async function incrementCarViewCount(carId: string): Promise<void>
export async function getCarViewCount(carId: string): Promise<number>
```

---

## 5. Phase 4: Host Calendar Enhancement

### 5.1 Database Schema

```sql
CREATE TABLE public.car_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(car_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.car_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Car owners can manage their blocked dates
CREATE POLICY "Owners can manage blocked dates"
  ON public.car_blocked_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.id = car_blocked_dates.car_id 
      AND cars.owner_id = auth.uid()
    )
  );

-- Anyone can view blocked dates (for booking availability)
CREATE POLICY "Anyone can view blocked dates"
  ON public.car_blocked_dates FOR SELECT
  USING (true);
```

### 5.2 Component: `src/components/host/HostAvailabilityCalendar.tsx`

**Features:**
- Monthly calendar view with navigation
- Color coding:
  - 🟢 Green: Available
  - 🔵 Blue: Booked (with booking details on tap)
  - ⚫ Gray: Blocked by host
  - 🔴 Red: Past dates (non-interactive)
- Tap to block/unblock available dates
- Long-press or click booked dates to view booking details
- Bulk date selection for blocking date ranges
- Sync with existing bookings automatically

### 5.3 Service Layer

#### File: `src/services/carAvailabilityService.ts`

```typescript
export async function getCarBlockedDates(carId: string): Promise<Date[]>
export async function blockCarDates(carId: string, dates: Date[], reason?: string): Promise<void>
export async function unblockCarDates(carId: string, dates: Date[]): Promise<void>
export async function getCarAvailability(carId: string, month: Date): Promise<AvailabilityData>
```

---

## 6. Phase 5: Chat Enhancements

### 6.1 Active Now Indicator

#### Update: `src/components/chat/ChatHeader.tsx`

- Show green dot when user `is_online = true`
- Show "Active now" text next to avatar
- Show "Last seen X ago" when offline (using `last_seen_at`)

**Implementation:**
```typescript
// Use existing profile fields
const isOnline = otherUser?.is_online;
const lastSeen = otherUser?.last_seen_at;
```

### 6.2 Quick Replies Component

#### File: `src/components/chat/QuickReplySuggestions.tsx`

**Renter Quick Replies:**
- "Is this car still available?"
- "What's the pickup location?"
- "Can I extend my booking?"
- "What documents do I need?"

**Host Quick Replies:**
- "Yes, it's available! When would you like to book?"
- "The pickup location is at..."
- "Sure, I can extend your booking."
- "Please have your valid ID and driver's license ready."

**Features:**
- Horizontal scrollable chips above message input
- Tap to insert into message field
- Context-aware (show renter or host suggestions based on role)
- Hide after first message in conversation

---

## 7. Database Migrations

### Migration Files to Create

| Order | Filename | Purpose |
|-------|----------|---------|
| 1 | `20251204_create_promo_codes_table.sql` | Promo codes table + RLS |
| 2 | `20251204_create_promo_code_usage_table.sql` | Usage tracking + RLS |
| 3 | `20251204_add_car_view_count.sql` | Add view_count to cars |
| 4 | `20251204_create_car_blocked_dates.sql` | Calendar blocking table |
| 5 | `20251204_seed_first100_promo_code.sql` | Seed FIRST100 code |

---

## 8. Testing Checklist

### Promo Code System
- [ ] Validate FIRST100 code works for new users
- [ ] Verify one-use-per-user restriction works
- [ ] Test max usage limit (500) enforcement
- [ ] Confirm discount appears correctly in booking summary
- [ ] Test expired code rejection with clear error message
- [ ] Test invalid code handling
- [ ] Test minimum booking amount restriction (if set)
- [ ] Verify promo code usage is recorded in database

### Promo Code History UI
- [ ] Available tab shows unredeemed codes
- [ ] Used tab shows redemption details with date
- [ ] Expired tab shows past codes
- [ ] Total savings calculates correctly
- [ ] Copy code functionality works
- [ ] Pull-to-refresh updates data
- [ ] Empty states display correctly
- [ ] Badge count shows on profile menu

### Car Views Tracking
- [ ] View count increments on car detail page load
- [ ] Owner's own views don't increment count
- [ ] Rapid refreshes don't inflate count (debounce works)
- [ ] View count displays on host car management

### Host Calendar
- [ ] Calendar shows current month correctly
- [ ] Booked dates show in blue with booking indicator
- [ ] Blocked dates show in gray
- [ ] Tapping available date blocks it
- [ ] Tapping blocked date unblocks it
- [ ] Booked dates cannot be blocked
- [ ] Date range selection works for bulk blocking

### Chat Enhancements
- [ ] Active now indicator shows for online users
- [ ] Last seen shows correct relative time
- [ ] Quick replies appear above message input
- [ ] Tapping quick reply inserts text
- [ ] Correct quick replies show based on user role

---

## 9. Rollout Timeline

| Phase | Feature | Est. Effort | Priority |
|-------|---------|-------------|----------|
| 1 | Promo Code System (DB + Service) | 4 hours | CRITICAL |
| 2 | Promo Code History UI | 3 hours | HIGH |
| 3 | Car Views Tracking | 1.5 hours | MEDIUM |
| 4 | Host Calendar Enhancement | 3 hours | MEDIUM |
| 5 | Chat Enhancements | 2 hours | LOW |

**Total Estimated Effort:** 13.5 hours

### Recommended Implementation Order

1. **Week 1 (Critical Path)**
   - Phase 1: Promo Code System - Required for FIRST100 campaign
   - Phase 2: Promo Code History UI - User-facing feature for campaign

2. **Week 2 (Enhancements)**
   - Phase 3: Car Views Tracking - Host value proposition
   - Phase 4: Host Calendar Enhancement - Host usability

3. **Week 3 (Polish)**
   - Phase 5: Chat Enhancements - User experience improvement

---

## Appendix A: File Change Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/PromoCodeHistory.tsx` | Promo code history page |
| `src/components/promo/PromoCodeCard.tsx` | Code display card |
| `src/components/promo/PromoCodeSummary.tsx` | Savings summary |
| `src/components/promo/PromoCodeTabs.tsx` | Tab navigation |
| `src/components/promo/PromoCodeInput.tsx` | Reusable code input |
| `src/hooks/usePromoCodeHistory.ts` | Data fetching hook |
| `src/services/promoCodeService.ts` | Promo code operations |
| `src/services/carViewsService.ts` | View count tracking |
| `src/services/carAvailabilityService.ts` | Calendar availability |
| `src/components/host/HostAvailabilityCalendar.tsx` | Calendar component |
| `src/components/chat/QuickReplySuggestions.tsx` | Quick replies |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/ProfileMenu.tsx` | Add Rewards & Discounts menu item |
| `src/components/booking/BookingDialog.tsx` | Add promo code input and discount display |
| `src/pages/CarDetails.tsx` | Add view tracking on load |
| `src/components/host/HostCarCard.tsx` | Show view count |
| `src/components/chat/ChatHeader.tsx` | Add active indicator |
| `src/App.tsx` | Add /promo-codes route |

---

## Appendix B: Related Documents

- [Launch Communications Plan](./mobirdes-launch-communications-plan-2025-11-05.pdf)
- [GTM Plan](./20251218_MobiRides_Commercialization_GTM_Plan.md)
- [Profile Menu Implementation Plan](./archived/profile-menu-implementation-plan.md)

---

*Document created: December 4, 2025*  
*Last updated: December 4, 2025*
