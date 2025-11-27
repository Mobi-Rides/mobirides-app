# Migration Mapping Documentation

## ✅ RESOLVED - November 27, 2025

**All migrations synchronized between local and production.**

**Generated:** 2025-11-26  
**Updated:** 2025-11-27  
**Purpose:** Map unnamed production migrations to local migration files

---

## Final Summary

- **Total Synced Migrations:** 136
- **Local & Remote Match:** 100%
- **Unnamed Migrations:** All resolved
- **Production Tables:** 57

---

## Unnamed Production Migrations (11 total)

### Recent Migrations (November 2025)

| Production Version | Local Version | Local Filename | Status | Description |
|-------------------|---------------|----------------|--------|-------------|
| `20251126134113` | `20251126134114` | `20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql` | ✅ Mapped | **Create Verification Storage Buckets** - Creates verification-documents, verification-selfies, verification-temp buckets with RLS policies and cleanup function |
| `20251126090706` | `20251126090707` | `20251126090707_create the missing log_admin_activity_rpc_function.sql` | ✅ Mapped | **Create log_admin_activity RPC** - Creates RPC function for logging admin activities with IP/user-agent tracking |
| `20251126085229` | `20251126085230` | `20251126085230_make_log_admin_changes_function_defensive.sql` | ✅ Mapped | **Defensive log_admin_changes Function** - Makes trigger function defensive to handle missing admin_activity_logs table |
| `20251126084309` | `20251126084310` | `20251126084310_create_missing_tables_that_exist_in_production.sql` | ✅ Mapped | **Create 7 Missing Tables** - Creates car_images, license_verifications, saved_cars, commission_rates, admin_sessions, admin_activity_logs, device_tokens |

### Mid-November Migrations (2025)

| Production Version | Local Version | Status | Description |
|-------------------|---------------|--------|-------------|
| `20251125145805` | `20251125145805` | ✅ Synced | **Admins Table** - Present in both local and production |
| `20251124110226` | `20251124110226` | ✅ Synced | **Notification Enum Values** - Present in both local and production |
| `20251124110205` | `20251124110205` | ✅ Synced | **Notification Enum Values** - Present in both local and production |
| `20251124105912` | `20251124105912` | ✅ Synced | **Notification Enum Values** - Present in both local and production |

### Late November Migrations (2025)

| Production Version | Local Version | Status | Description |
|-------------------|---------------|--------|-------------|
| `20251123131135` | `20251123131135` | ✅ Synced | **Wallet Notification Function** - Present in both local and production |
| `20251123131109` | `20251123131109` | ✅ Synced | **Push Subscription Helpers** - Present in both local and production |
| `20251123131016` | `20251123131016` | ✅ Synced | **Reviews Table** - Present in both local and production |

---

## Timestamp Mismatch Pattern

**Pattern Identified:** Local migrations are off by **1 second** from production timestamps.

### Examples:
- Production: `20251126134113` → Local: `20251126134114` (diff: +1 sec)
- Production: `20251126090706` → Local: `20251126090707` (diff: +1 sec)
- Production: `20251126085229` → Local: `20251126085230` (diff: +1 sec)
- Production: `20251126084309` → Local: `20251126084310` (diff: +1 sec)

**Root Cause:** These migrations were likely created in the Supabase dashboard SQL Editor, which generates a timestamp when the migration is initiated. When pulled to local via `supabase db pull`, a new timestamp is generated (1 second later).

---

## Named Production Migrations (24 total)

Production has 24 migrations with proper names that exist in the local repository. Examples:

- `20230101000000` - `create_base_schema`
- `20231028173000` - `add_location_sharing_fields`
- `20241205000000` - `add_verification_system`
- `20250726204653` - `add_admin_role_to_user_role_enum`
- `20251024100000` - `dedupe_notifications_before_unique_constraint`
- `20251024112000` - `add_address_confirmation_enum_value`

---

## Resolution Summary (November 27, 2025)

### Actions Taken

1. **Legacy Migrations Marked as Reverted:**
   - `20250131` - Marked as reverted (legacy dashboard migration)
   - `20251120` - Marked as reverted (legacy dashboard migration)

2. **Result:**
   - All 136 migrations now have matching local and remote entries
   - Types regeneration works without errors
   - No migration history conflicts

### Commands Used

```bash
# Mark legacy migrations as reverted
npx supabase migration repair --status reverted 20250131 --linked
npx supabase migration repair --status reverted 20251120 --linked

# Verify sync
npx supabase migration list --linked

# Regenerate types successfully
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## Final State

| Migration Category | Count | Status |
|-------------------|-------|--------|
| Total Migrations | 136 | ✅ All synced |
| Local & Remote Match | 136 | ✅ 100% |
| Unnamed Migrations | 0 | ✅ All resolved |
| Reverted Migrations | 2 | ✅ Documented |

---

## Completed Steps

1. ✅ **Step 1.2 Complete** - Documented unnamed migrations
2. ✅ **Step 1.3 Complete** - Created mapping document
3. ✅ **Step 1.4 Complete** - Investigated all migrations
4. ✅ **Phase 2 Complete** - Fixed production migration history
5. ✅ **Phase 3 Complete** - Synced local migration history

---

## Notes

- All unnamed migrations were created between Nov 23-26, 2025
- Suggests recent dashboard-based migration activity
- Need to establish workflow to prevent future unnamed migrations
- Consider implementing pre-commit hooks to validate migration naming
