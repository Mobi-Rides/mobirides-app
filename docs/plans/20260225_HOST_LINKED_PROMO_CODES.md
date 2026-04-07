# Feature: Host-Linked Promo Codes

**Document ID:** FEAT-PROMO-2026-02-25  
**Priority:** P1 (High)  
**Created:** 2026-02-25  
**Owner:** Engineering  
**Status:** Ready for Implementation

---

## Context & Business Case

Currently, all promo codes on MobiRides are **platform-wide** — any valid code applies to any car booking. This limits promotional flexibility for hosts who want to run targeted campaigns on their own listings.

This feature adds the ability for admins to **scope a promo code to a specific host** (all their cars) and optionally to **specific individual cars** within that host's fleet. Platform-wide codes (no host linked) remain fully supported.

---

## Current State

| Aspect | Status |
|--------|--------|
| `promo_codes.host_id` column | ❌ Does not exist |
| `promo_code_cars` junction table | ❌ Does not exist |
| `validatePromoCode` checks car scope | ❌ No — validates code globally |
| `PromoCodeInput` accepts `carId` | ❌ No |
| Admin form has host/car selector | ❌ No |
| Admin table shows scope | ❌ No |

---

## Migration Creation Protocol

### Pre-Migration Checklist

> Per MOB-113 and `memory/infrastructure/migration-impact-protocol`

#### 1. Duplicate Migration Check

Before creating any migration file:

- [ ] **Search existing migrations** for overlapping DDL:
  ```bash
  grep -ril "promo_code" supabase/migrations/
  grep -ril "host_id.*promo" supabase/migrations/
  grep -ril "promo_code_cars" supabase/migrations/
  ```
- [ ] **Verify no pending/unmerged branches** contain similar schema changes
- [ ] **Check `supabase migration list`** for any applied-but-untracked migrations touching promo tables
- [ ] **Confirm column does not already exist** in production:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'promo_codes' AND column_name = 'host_id';
  
  SELECT table_name FROM information_schema.tables 
  WHERE table_name = 'promo_code_cars';
  ```

**Result:** Both queries must return 0 rows before proceeding.

#### 2. Impact Assessment

**Tables modified:**

| Table | Change | Risk |
|-------|--------|------|
| `promo_codes` | Add nullable `host_id` column | **Low** — additive, nullable, no existing queries break |
| `promo_code_cars` (new) | Create junction table | **None** — new table, no consumers yet |

**Consumers of `promo_codes` (codebase search results):**

| File | Usage | Impact |
|------|-------|--------|
| `src/services/promoCodeService.ts` | CRUD, validation | Must update interface + validation logic |
| `src/pages/admin/AdminPromoCodes.tsx` | Admin table + create form | Must add scope UI |
| `src/components/promo/PromoCodeInput.tsx` | Renter-facing input | Must accept `carId` prop |
| `src/components/promo/PromoCodeCard.tsx` | Display component | Low — may show scope badge |
| `src/components/promo/PromoCodeHistory.tsx` | Usage history | No change needed |
| `src/hooks/usePromoCodeHistory.ts` | Data fetching | No change needed |
| `src/components/booking/BookingDialog.tsx` | Booking flow | Must pass `carId` to `PromoCodeInput` |

**RLS Policy Impact:**
- Existing `promo_codes` RLS: unchanged (SELECT for authenticated remains)
- New `promo_code_cars` table: needs SELECT for authenticated, INSERT/DELETE for service role

**Rollback Strategy:**
```sql
ALTER TABLE promo_codes DROP COLUMN IF EXISTS host_id;
DROP TABLE IF EXISTS promo_code_cars;
```

#### 3. Migration Naming Convention

- Format: `YYYYMMDDHHMMSS_descriptive_snake_case.sql`
- No spaces in filenames
- No UUID suffixes
- Use `IF NOT EXISTS` / `CREATE OR REPLACE` for idempotency

---

## Database Migration

**Migration:** `20260225_add_host_linking_to_promo_codes`

```sql
-- =================================================
-- FEATURE: Host-Linked Promo Codes
-- Adds host_id scope to promo_codes and per-car targeting
-- =================================================

-- 1. Add host_id to promo_codes (nullable = platform-wide when NULL)
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for querying codes by host
CREATE INDEX IF NOT EXISTS idx_promo_codes_host_id 
  ON public.promo_codes(host_id) WHERE host_id IS NOT NULL;

-- 2. Create junction table for per-car targeting
CREATE TABLE IF NOT EXISTS public.promo_code_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, car_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_code_cars_promo_id 
  ON public.promo_code_cars(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_cars_car_id 
  ON public.promo_code_cars(car_id);

-- 3. Enable RLS
ALTER TABLE public.promo_code_cars ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (needed for validation during booking)
CREATE POLICY "promo_code_cars_select_authenticated"
  ON public.promo_code_cars FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify (via service role or admin check)
CREATE POLICY "promo_code_cars_insert_admin"
  ON public.promo_code_cars FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

CREATE POLICY "promo_code_cars_delete_admin"
  ON public.promo_code_cars FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
```

---

## Frontend Changes

### 1. Update `PromoCode` Interface (`promoCodeService.ts`)

```typescript
export interface PromoCode {
  // ... existing fields
  host_id: string | null;
  // Joined fields (optional, from queries)
  profiles?: { full_name: string } | null;
  promo_code_cars?: { car_id: string }[];
}
```

### 2. Update Validation Logic (`validatePromoCode`)

Add `carId?: string` parameter. After existing checks:

```
promo code has host_id?
├─ NO → platform-wide, valid ✓
└─ YES → fetch car.owner_id for carId
     ├─ car.owner_id !== host_id → "This code is only valid for [host]'s listings"
     └─ car.owner_id === host_id → promo_code_cars entries exist?
          ├─ YES → carId in list?
          │    ├─ NO → "This code is not valid for this vehicle"
          │    └─ YES → valid ✓
          └─ NO → valid ✓ (applies to all host's cars)
```

### 3. Update `PromoCodeInput` Component

- Add optional `carId?: string` prop
- Pass through to `validatePromoCode`

### 4. Update `BookingDialog`

- Pass `car.id` to `<PromoCodeInput carId={car.id} />`

### 5. Update Admin Create Form (`AdminPromoCodes.tsx`)

- Add **Scope** radio: "Platform-wide" (default) | "Host-specific"
- When "Host-specific": searchable host dropdown (query `profiles` where role = `host`)
- When host selected: optional car multi-select (query `cars` by `owner_id`)
- On submit: insert promo code with `host_id`, then batch-insert car IDs into `promo_code_cars`

### 6. Update Admin Table Display

- Fetch with `.select('*, profiles:host_id(full_name), promo_code_cars(car_id)')`
- Add "Scope" column: "Platform-wide" or `{host_name} ({n} cars)` / `{host_name} (all cars)`

---

## Files to Create/Modify

| File | Action | Change |
|------|--------|--------|
| Migration SQL | **Create** | `host_id` column + `promo_code_cars` table + RLS |
| `src/services/promoCodeService.ts` | **Modify** | Update interface, add `carId` to validation |
| `src/components/promo/PromoCodeInput.tsx` | **Modify** | Add `carId` prop |
| `src/components/booking/BookingDialog.tsx` | **Modify** | Pass `car.id` to `PromoCodeInput` |
| `src/pages/admin/AdminPromoCodes.tsx` | **Modify** | Host/car selectors in form, Scope column in table |

---

## Testing Plan

| Test | Expected Result |
|------|----------------|
| Create platform-wide code in admin | `host_id` is NULL, no `promo_code_cars` rows |
| Create host-specific code (all cars) | `host_id` set, no `promo_code_cars` rows |
| Create host-specific code (2 cars) | `host_id` set, 2 `promo_code_cars` rows |
| Apply platform-wide code to any car | ✅ Accepted |
| Apply host code to that host's car | ✅ Accepted |
| Apply host code to a different host's car | ❌ Rejected with clear message |
| Apply host+car code to unlisted car of same host | ❌ Rejected |
| Delete a car that has promo links | `promo_code_cars` row cascades, code still works for other cars |
| Admin table shows correct scope labels | Platform-wide / Host name + car count |

---

## Definition of Done

- [ ] Migration applied cleanly (`supabase db reset` passes)
- [ ] Types regenerated and build passes (`npm run build`)
- [ ] Platform-wide codes continue to work unchanged
- [ ] Host-scoped codes validated correctly during booking
- [ ] Admin can create, view, and manage host-linked codes
- [ ] Scope column visible in admin promo codes table
- [ ] No console errors on `/admin/promo-codes`
- [ ] RLS policies tested for authenticated and anon roles
