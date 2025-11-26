#!/bin/bash
# Phase 2: Fix Production Migration History
# Run these commands to sync production migration tracking

echo "========================================="
echo "Phase 2: Fix Production Migration History"
echo "========================================="
echo ""

echo "Step 1: Rename local files to match production timestamps"
echo "-----------------------------------------------------------"
echo "These 4 local migrations have +1 second timestamp difference:"
echo ""

# Check if files exist before renaming
if [ -f "supabase/migrations/20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql" ]; then
  echo "Renaming verification storage buckets migration..."
  mv "supabase/migrations/20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql" \
     "supabase/migrations/20251126134113_verification_storage_buckets.sql"
else
  echo "⚠️  20251126134114_*.sql not found"
fi

if [ -f "supabase/migrations/20251126090707_create the missing log_admin_activity_rpc_function.sql" ]; then
  echo "Renaming log admin activity RPC migration..."
  mv "supabase/migrations/20251126090707_create the missing log_admin_activity_rpc_function.sql" \
     "supabase/migrations/20251126090706_log_admin_activity_rpc.sql"
else
  echo "⚠️  20251126090707_*.sql not found"
fi

if [ -f "supabase/migrations/20251126085230_make_log_admin_changes_function_defensive.sql" ]; then
  echo "Renaming defensive log admin changes migration..."
  mv "supabase/migrations/20251126085230_make_log_admin_changes_function_defensive.sql" \
     "supabase/migrations/20251126085229_defensive_log_admin_changes.sql"
else
  echo "⚠️  20251126085230_*.sql not found"
fi

if [ -f "supabase/migrations/20251126084310_create_missing_tables_that_exist_in_production.sql" ]; then
  echo "Renaming create missing tables migration..."
  mv "supabase/migrations/20251126084310_create_missing_tables_that_exist_in_production.sql" \
     "supabase/migrations/20251126084309_create_missing_tables.sql"
else
  echo "⚠️  20251126084310_*.sql not found"
fi

echo ""
echo "✅ Step 1 complete - Local files renamed"
echo ""

echo "Step 2: Mark production-only migrations as applied"
echo "---------------------------------------------------"
echo "Run these commands to mark dashboard-created migrations as applied:"
echo ""

# Archived migrations from supabase/migrations/archive/
echo "# Archived migrations (already applied in production):"
npx supabase migration repair --status applied 20241220
npx supabase migration repair --status applied 20241220000002
npx supabase migration repair --status applied 20241230
npx supabase migration repair --status applied 20250120000005
npx supabase migration repair --status applied 20250120000006
npx supabase migration repair --status applied 20251024100000

echo ""
echo "# Dashboard-created migrations (functionality exists via other migrations):"
echo "# These 7 migrations were created via Supabase Dashboard Nov 23-25, 2025"
npx supabase migration repair --status applied 20251123131016
npx supabase migration repair --status applied 20251123131109
npx supabase migration repair --status applied 20251123131135
npx supabase migration repair --status applied 20251124105912
npx supabase migration repair --status applied 20251124110205
npx supabase migration repair --status applied 20251124110226
npx supabase migration repair --status applied 20251125145805

echo ""
echo "✅ Step 2 complete - Production migrations marked as applied"
echo ""
echo "========================================="
echo "Phase 2 Complete!"
echo "========================================="
echo ""
echo "Next: Run 'bash scripts/phase3-sync-local-history.sh' for Phase 3"
