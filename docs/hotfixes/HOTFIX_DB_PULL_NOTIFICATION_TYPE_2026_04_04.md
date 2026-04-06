# Hotfix: `notification_type__old_version_to_be_dropped` Dependency Error
**Date:** 2026-04-04  
**Ticket:** BUG-003  
**Author:** Modisa Maphanyane  
**Status:** 🔴 Open — Awaiting migration file edits  
**Severity:** Critical (blocks `supabase db pull`)

---

## Summary

`supabase db pull` fails with `SQLSTATE 2BP01` — cannot drop type `notification_type__old_version_to_be_dropped` because 7 functions still reference it via their parameter signatures. A secondary `NOTICE` about missing index `platform_settings_setting_key_key` is harmless.

---

## Error Output

```
ERROR: cannot drop type notification_type__old_version_to_be_dropped because other objects depend on it (SQLSTATE 2BP01)

Dependent functions:
  - create_booking_notification(uuid, ..., notification_type__old_version_to_be_dropped, ...) — 2 overloads
  - create_notification_with_expiration(uuid, notification_type__old_version_to_be_dropped, ...)
  - create_wallet_notification(uuid, uuid, notification_type__old_version_to_be_dropped, ...)
  - get_notification_expiration_info(notification_type__old_version_to_be_dropped)
  - get_user_notifications(integer, integer, boolean)
  - update_notification_expiration_policy(notification_type__old_version_to_be_dropped, integer, boolean)

At statement: DROP TYPE "public"."notification_type__old_version_to_be_dropped"
```

---

## Root Cause

The Supabase enum rename-recreate-drop pattern for `notification_type` is used in two `remote_schema.sql` files. Both attempt to drop the `__old_version` type **without first dropping all dependent function overloads**.

| File | Issue |
|------|-------|
| `20260319212624_remote_schema.sql` | Drops *some* notification functions (lines 649-691) but misses 7 overloads that still reference the old enum type. Line 1226 then fails on `DROP TYPE`. |
| `20260328135949_remote_schema.sql` | Lines 131-139 repeat the identical rename+recreate+drop pattern — completely redundant and triggers the same error again. |

---

## Tickets

### MOB-801 — Drop dependent function overloads before enum type drop

| Field | Detail |
|-------|--------|
| **Priority** | 🔴 Critical |
| **Status** | 🔴 Open |
| **File** | `supabase/migrations/20260319212624_remote_schema.sql` |
| **Consumers** | Shadow DB replay (`supabase db pull`) |

**Description:**  
Insert 7 `DROP FUNCTION IF EXISTS` statements immediately before the `DROP TYPE "public"."notification_type__old_version_to_be_dropped"` line (~line 1226).

**SQL to insert:**
```sql
-- Drop functions that still reference the old notification_type enum
DROP FUNCTION IF EXISTS public.create_booking_notification(uuid, notification_type__old_version_to_be_dropped, notification_type__old_version_to_be_dropped, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_booking_notification(uuid, notification_type__old_version_to_be_dropped, notification_type__old_version_to_be_dropped, text, text, jsonb, notification_role);
DROP FUNCTION IF EXISTS public.create_notification_with_expiration(uuid, notification_type__old_version_to_be_dropped, text, text, text, notification_role, uuid, uuid, uuid, integer, jsonb, integer);
DROP FUNCTION IF EXISTS public.create_wallet_notification(uuid, uuid, notification_type__old_version_to_be_dropped, text, text, jsonb, notification_role);
DROP FUNCTION IF EXISTS public.get_notification_expiration_info(notification_type__old_version_to_be_dropped);
DROP FUNCTION IF EXISTS public.get_user_notifications(integer, integer, boolean);
DROP FUNCTION IF EXISTS public.update_notification_expiration_policy(notification_type__old_version_to_be_dropped, integer, boolean);
```

**Acceptance Criteria:**
- [ ] All 7 `DROP FUNCTION IF EXISTS` statements are present before the `DROP TYPE` line
- [ ] Functions are recreated later in the same file with correct `public.notification_type` signatures (verify lines 2280-3372)
- [ ] `supabase db pull` passes this statement without `SQLSTATE 2BP01`

---

### MOB-802 — Remove redundant notification_type rename block

| Field | Detail |
|-------|--------|
| **Priority** | 🟡 High |
| **Status** | 🔴 Open |
| **File** | `supabase/migrations/20260328135949_remote_schema.sql` |
| **Consumers** | Shadow DB replay (`supabase db pull`) |

**Description:**  
Remove lines 131-139 — the entire `notification_type` rename+recreate+migrate+drop block. The enum values are identical to what `20260319212624` already established. This block is a no-op that only re-triggers the same dependency error.

**Lines to remove:**
```sql
alter type "public"."notification_type" rename to "notification_type__old_version_to_be_dropped";
create type "public"."notification_type" as enum (...);
alter table "public"."notification_expiration_policies" alter column notification_type type ... using ...;
alter table "public"."notifications" alter column type type ... using ...;
drop type "public"."notification_type__old_version_to_be_dropped";
```

**Acceptance Criteria:**
- [ ] Redundant rename+recreate+drop block is removed
- [ ] No other references to `notification_type__old_version_to_be_dropped` remain in this file
- [ ] `supabase db pull` completes without errors from this file

---

## Impact Assessment

| Area | Impact |
|------|--------|
| **Functions** | All 7 dropped functions are recreated later in `20260319212624` with correct `public.notification_type` signatures — **zero functionality loss** |
| **Tables** | `notifications.type` and `notification_expiration_policies.notification_type` columns are already migrated by existing `ALTER` statements — **no change** |
| **Frontend** | `src/services/completeNotificationService.ts`, `src/utils/notificationHelpers.ts`, `src/hooks/usePlatformSettings.ts` — **no impact** (use Supabase client, not raw SQL) |
| **Production DB** | **No effect** — these edits only fix the shadow DB replay used by `db pull` |
| **Existing data** | **No risk** — no `DROP TABLE`, no column changes, no data migration |

---

## Execution Order

1. **MOB-801** — Edit `20260319212624_remote_schema.sql` (add function drops)
2. **MOB-802** — Edit `20260328135949_remote_schema.sql` (remove redundant block)
3. **Verify** — Run `supabase db pull` to confirm clean completion

---

## Verification

```bash
supabase db pull
# Expected: No SQLSTATE 2BP01 errors
# Expected: Schema written to new remote_schema.sql
# Expected: "Finished supabase db pull ✅"
```

---

## Related

- [`docs/hotfixes/HOTFIX_DB_PULL_FIX_2026_03_28.md`](./HOTFIX_DB_PULL_FIX_2026_03_28.md) — Same pattern (legacy `create_handover_notification` overloads)
- BUG-001 (Resolved 2026-03-28) — Prior `db pull` fix
