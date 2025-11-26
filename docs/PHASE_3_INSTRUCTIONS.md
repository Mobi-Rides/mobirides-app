# Phase 3: Sync Local Migration History

## Overview
Phase 3 synchronizes all local-only migrations (~96 files) to production's migration tracking without re-running them.

## Current State

From Phase 2 results:
- ✅ **35 migrations synced** (both local & remote)
- 📋 **~96 local-only migrations** need sync
- 🔴 **6 remote-only migrations** (archived/superseded)

## Prerequisites

- ✅ Phase 2 complete
- ✅ Production schema backup exists
- ✅ Supabase CLI linked to production

## What This Phase Does

1. **Verifies Schema Consistency** - Confirms local and production schemas match
2. **Syncs Migration History** - Marks all local migrations as "applied" in production
3. **Validates Completion** - Ensures no drift remains

## Important Context

**Why is this safe?**
- Production already has the correct schema (57 tables, all functions, etc.)
- Local migrations created this schema over time
- We're just updating the migration tracking, not the schema itself
- `supabase db push` is smart enough to skip migrations that are already applied

## Step-by-Step Instructions

### Option A: Run Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/phase3-sync-local-history.sh

# Run the script
bash scripts/phase3-sync-local-history.sh
```

The script will:
1. Check for schema differences (`supabase db diff`)
2. Ask for confirmation before pushing
3. Push migration history to production
4. Display final migration status

### Option B: Manual Execution

#### Step 1: Check Schema Consistency

```bash
# This should show NO differences if Phase 2 was successful
npx supabase db diff --linked --schema public
```

**Expected Output:**
```
Finished supabase db diff on branch main.
```

If you see schema differences, **STOP** and investigate before proceeding.

#### Step 2: Push Migration History

```bash
# This marks all local migrations as applied in production
npx supabase db push --linked
```

**What happens:**
- Supabase CLI compares local migrations with production
- For each local-only migration, it adds a record to `schema_migrations` table
- NO schema changes are applied (they already exist)
- Operation is idempotent (safe to re-run)

#### Step 3: Verify Sync

```bash
npx supabase migration list --linked
```

**Expected Result:**
All ~131 migrations should appear in **both** Local and Remote columns.

## Handling Remote-Only Migrations

You'll still see 6 remote-only migrations:
- `20241220` - Archived, functionality exists
- `20241220000002` - Archived, functionality exists  
- `20241230` - Archived, functionality exists
- `20250103` - Undated migration, functionality exists
- `20250120000006` - Archived, functionality exists
- `20251024100000` - Archived, functionality exists

**Action:** These can be ignored. They're superseded by local migrations.

## Troubleshooting

### Error: "Schema mismatch detected"
**Cause:** `db diff` found differences between local and production

**Solution:**
1. Review the diff output carefully
2. Identify which tables/columns differ
3. Create a migration to fix the difference OR
4. Update local migrations to match production

### Error: "Migration already exists"
**Cause:** Migration is already in production (shouldn't happen after Phase 2)

**Solution:** This is actually fine - skip to next step

### Error: "Permission denied"
**Cause:** CLI doesn't have admin access to production

**Solution:**
1. Verify you're linked to correct project: `npx supabase status`
2. Re-authenticate: `npx supabase login`
3. Check project permissions in Supabase dashboard

### Push Takes a Long Time
**Expected:** Pushing ~96 migration records can take 2-5 minutes

**Action:** Be patient, let it complete

## What Gets Modified

### Local Changes
- None

### Production Changes
- ~96 new rows in `supabase_migrations.schema_migrations` table
- No schema modifications
- No data modifications

## Risk Level: 🟡 Medium

- Safe operation (only migration metadata)
- No schema changes
- No data loss risk
- Can be verified before and after
- Reversible (can delete migration records if needed)

## Success Criteria

After Phase 3, the following should be true:

✅ `npx supabase db diff --linked` shows no differences
✅ `npx supabase migration list --linked` shows ~125+ migrations with both Local and Remote
✅ Production application continues working normally
✅ No "remote migrations not found" warnings
✅ `npx supabase db reset --local` works without errors

## Expected Timeline

- Schema verification: 1-2 minutes
- Push operation: 2-5 minutes  
- Verification: 1 minute
- **Total: ~5-10 minutes**

## Next Steps

After Phase 3 is complete:
1. ✅ Verify all migrations are synced
2. ✅ Test local reset: `npx supabase db reset --local`
3. ✅ Confirm production app works normally
4. 🎉 Proceed to Phase 4 (Final Verification & Prevention)

## Notes

- This is the most critical phase
- Double-check schema diff before pushing
- Keep backup handy (though we won't modify schema)
- Operation is logged in production audit trail
- Can be performed during business hours (no downtime)
