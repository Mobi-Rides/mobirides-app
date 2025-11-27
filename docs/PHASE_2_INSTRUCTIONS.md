# Phase 2: Fix Production Migration History

## ✅ COMPLETE - November 27, 2025

**Final Status:** All 136 migrations synced between local and production  
**Resolution:** Migrations `20250131` and `20251120` marked as `reverted` via `supabase migration repair`

---

## Overview
Phase 2 fixes the production migration tracking to properly name and track all migrations.

## What This Phase Does

1. **Renames Local Files** - Fixes 4 local migrations with +1 second timestamp drift
2. **Marks Migrations as Applied** - Uses `supabase migration repair` to sync migration history

## Prerequisites

- ✅ Phase 1 complete (investigation done)
- Backup created: `production_schema_backup.sql`
- Supabase CLI installed
- Linked to production project

## Step-by-Step Instructions

### Option A: Run Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/phase2-fix-production-history.sh

# Run the script
bash scripts/phase2-fix-production-history.sh
```

### Option B: Manual Execution

If you prefer to run commands manually:

#### Step 1: Rename Local Migration Files

```bash
# Rename files to match production timestamps (remove +1 second)
mv supabase/migrations/20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql \
   supabase/migrations/20251126134113_verification_storage_buckets.sql

mv "supabase/migrations/20251126090707_create the missing log_admin_activity_rpc_function.sql" \
   supabase/migrations/20251126090706_log_admin_activity_rpc.sql

mv supabase/migrations/20251126085230_make_log_admin_changes_function_defensive.sql \
   supabase/migrations/20251126085229_defensive_log_admin_changes.sql

mv supabase/migrations/20251126084310_create_missing_tables_that_exist_in_production.sql \
   supabase/migrations/20251126084309_create_missing_tables.sql
```

#### Step 2: Mark Archived Migrations as Applied

These migrations exist in `supabase/migrations/archive/` but are recorded in production:

```bash
npx supabase migration repair --status applied 20241220 --linked
npx supabase migration repair --status applied 20241220000002 --linked
npx supabase migration repair --status applied 20241230 --linked
npx supabase migration repair --status applied 20250120000005 --linked
npx supabase migration repair --status applied 20250120000006 --linked
npx supabase migration repair --status applied 20251024100000 --linked
```

#### Step 3: Mark Dashboard-Created Migrations as Applied

These 7 migrations were created via Dashboard (Nov 23-25, 2025). Their functionality already exists via other local migrations:

```bash
# Reviews table
npx supabase migration repair --status applied 20251123131016 --linked

# Push subscription helpers
npx supabase migration repair --status applied 20251123131109 --linked

# Wallet notification function
npx supabase migration repair --status applied 20251123131135 --linked

# Notification enum values
npx supabase migration repair --status applied 20251124105912 --linked
npx supabase migration repair --status applied 20251124110205 --linked
npx supabase migration repair --status applied 20251124110226 --linked

# Admins table
npx supabase migration repair --status applied 20251125145805 --linked
```

## Verification

After completing Phase 2, verify the changes:

```bash
# Check migration status
npx supabase migration list --linked

# Should show all migrations with proper status
```

## Actual Results (November 27, 2025)

What was actually completed:
- ✅ 2 migrations marked as `reverted` (`20250131`, `20251120`)
- ✅ 136 total migrations fully synced
- ✅ Types regenerated successfully: `npx supabase gen types typescript --linked`
- ✅ No migration history conflicts remaining

## Troubleshooting

### Error: "Migration not found"
- **Cause:** Migration version doesn't exist in production
- **Solution:** Skip that specific migration, it may have been manually removed

### Error: "Migration already applied"
- **Cause:** Migration already marked as applied
- **Solution:** This is fine, skip to next migration

### Files Not Found During Rename
- **Cause:** Files may have been renamed already or don't exist
- **Solution:** Check `supabase/migrations/` directory and adjust paths

## What Gets Modified

### Local Changes
- 4 migration files renamed (timestamp -1 second)
- No file content changes
- No schema changes

### Production Changes
- Migration tracking metadata updated
- No schema changes
- No data changes

## Risk Level: 🟡 Medium

- Safe operations (no schema modification)
- Only affects migration tracking metadata
- Can be reverted if needed
- Production schema remains unchanged

## Next Steps

After Phase 2 is complete:
1. Verify all migrations are properly tracked
2. Proceed to **Phase 3: Sync Local Migration History**
3. Run `bash scripts/phase3-sync-local-history.sh`

## Notes

- These operations are idempotent (safe to re-run)
- No downtime required
- Backup is only for safety (no schema changes)
- Can be performed during business hours
