

## Root Cause: Database Column Default

The `cars.is_available` column has a **default value of `true`** at the database level. While `AddCar.tsx` correctly passes `is_available: false`, any insert that omits this field (direct DB inserts, other code paths, or even edge cases where the field is dropped) will default to `true`, bypassing the approval requirement.

Evidence from production data (since March 1, 2026):
- Honda Fit (Mar 14): `is_available: true`, `verification_status: pending` -- live without approval
- Audi A5 (Mar 10, 15:37): `is_available: false`, `verification_status: pending` -- correctly pending
- Audi A5 (Mar 10, 15:00): `is_available: true`, `verification_status: pending` -- live without approval

### Fix

**1. Database migration: Change column default from `true` to `false`**

```sql
ALTER TABLE public.cars 
  ALTER COLUMN is_available SET DEFAULT false;
```

This ensures every new car listing defaults to unavailable, requiring admin approval via the existing `CarVerificationTable` approve action to set `is_available: true`.

**2. Fix existing unapproved-but-available cars**

Use the insert/update tool to correct the 2 cars currently live without approval:

```sql
UPDATE cars 
SET is_available = false 
WHERE verification_status = 'pending' 
  AND is_available = true;
```

No frontend code changes needed -- `AddCar.tsx` already sets `is_available: false` explicitly, and the admin approve flow already sets it to `true`.

