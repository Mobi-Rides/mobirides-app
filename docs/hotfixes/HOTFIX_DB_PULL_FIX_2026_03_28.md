# DB Pull Fix Report
**Date:** 2026-03-28  
**Ticket:** S9-001 (BUG-001)  
**Author:** Arnold (via Kiro)  
**Status:** ✅ Resolved — `supabase db pull` completes clean

---

## Summary

`supabase db pull` was failing with `SQLSTATE 42P13` and several other errors due to conflicting function overloads, duplicate type definitions, and duplicate policy creation across migrations. All issues were in the shadow DB replay sequence.

---

## Issues Fixed

| # | Error | SQLSTATE | Root Cause | Fix |
|---|-------|----------|-----------|-----|
| 1 | `create_handover_notification` return type conflict | 42P13 | Legacy 4-arg `void` overload (origin: `20250130000021`) and 8-arg `UUID` overload (origin: `20250130000025`) conflicted with the current 8-arg `bigint` version in `20260319212624` | New migration `20260319212623` drops both legacy overloads before `remote_schema.sql` runs |
| 2 | `http_request` type already exists | 42710 | `20260319212624_remote_schema.sql` tried to `CREATE TYPE http_request` which is owned by the `http` extension (enabled in `20251015060900`) | Commented out duplicate `CREATE TYPE` statements in `remote_schema.sql` |
| 3 | `is_admin()` is not unique | 42725 | No-arg `is_admin()` and `is_admin(uuid DEFAULT auth.uid())` both existed simultaneously, making no-arg calls ambiguous | Added `DROP FUNCTION IF EXISTS public.is_admin()` to `20260319212623` |
| 4 | Column `rate` does not exist on `insurance_commission_rates` | 42703 | `20260204000000` created the table without a `rate` column; `20260323000100` tried to `INSERT INTO ... (rate, ...)` | Added `ALTER TABLE ... ADD COLUMN IF NOT EXISTS rate decimal(5,4)` before the INSERT in `20260323000100` |
| 5 | Policy `Admins can view their own activity logs` already exists | 42710 | `20260326000400` recreated a policy that `20260319212624_remote_schema.sql` had already recreated | Added `DROP POLICY IF EXISTS` guards to `20260326000400` |
| 6 | Policy `Admins can view their own capabilities` already exists | 42710 | Same pattern in `20260326000500` | Added `DROP POLICY IF EXISTS` guards to `20260326000500` |

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/20260319212623_drop_legacy_handover_notification_fn.sql` | **New** — drops legacy `create_handover_notification` overloads and no-arg `is_admin()` |
| `supabase/migrations/20260319212624_remote_schema.sql` | Removed duplicate `CREATE TYPE http_request/http_response`; removed legacy 4-arg void `create_handover_notification` definition |
| `supabase/migrations/20260323000100_align_insurance_pricing_with_sla.sql` | Added `ALTER TABLE ... ADD COLUMN IF NOT EXISTS rate` before INSERT |
| `supabase/migrations/20260326000400_fix_admin_activity_logs_rls.sql` | Added `DROP POLICY IF EXISTS` guards before policy creation |
| `supabase/migrations/20260326000500_fix_admin_capabilities_rls.sql` | Added `DROP POLICY IF EXISTS` guards before policy creation |

---

## Verification

```
supabase db pull
# → All migrations apply cleanly
# → Schema written to supabase/migrations/20260328135949_remote_schema.sql
# → Finished supabase db pull ✅
```
