#!/bin/bash
# Phase 2: Fix Production Migration History (Revised)
# Only marks migrations that need syncing

echo "========================================="
echo "Phase 2: Fix Production Migration History"
echo "========================================="
echo ""

echo "Step 1: Rename local files to match production timestamps"
echo "-----------------------------------------------------------"

# Rename the 4 files with +1 second timestamp difference
if [ -f "supabase/migrations/20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql" ]; then
  echo "✓ Renaming 20251126134114 → 20251126134113"
  mv "supabase/migrations/20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql" \
     "supabase/migrations/20251126134113_verification_storage_buckets.sql"
fi

if [ -f "supabase/migrations/20251126090707_create the missing log_admin_activity_rpc_function.sql" ]; then
  echo "✓ Renaming 20251126090707 → 20251126090706"
  mv "supabase/migrations/20251126090707_create the missing log_admin_activity_rpc_function.sql" \
     "supabase/migrations/20251126090706_log_admin_activity_rpc.sql"
fi

if [ -f "supabase/migrations/20251126085230_make_log_admin_changes_function_defensive.sql" ]; then
  echo "✓ Renaming 20251126085230 → 20251126085229"
  mv "supabase/migrations/20251126085230_make_log_admin_changes_function_defensive.sql" \
     "supabase/migrations/20251126085229_defensive_log_admin_changes.sql"
fi

if [ -f "supabase/migrations/20251126084310_create_missing_tables_that_exist_in_production.sql" ]; then
  echo "✓ Renaming 20251126084310 → 20251126084309"
  mv "supabase/migrations/20251126084310_create_missing_tables_that_exist_in_production.sql" \
     "supabase/migrations/20251126084309_create_missing_tables.sql"
fi

echo ""
echo "✅ Step 1 Complete"
echo ""

echo "Step 2: Create placeholder files for production-only migrations"
echo "----------------------------------------------------------------"
echo "These migrations are already in production but don't exist locally."
echo "Creating empty placeholder files so migration repair can work..."
echo ""

# Create placeholders for the 7 dashboard-created migrations
mkdir -p supabase/migrations

echo "-- Production migration - already applied" > supabase/migrations/20251123131016_create_reviews_table_canonical.sql
echo "✓ Created placeholder: 20251123131016_create_reviews_table_canonical.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251123131109_create_push_subscription_helpers.sql
echo "✓ Created placeholder: 20251123131109_create_push_subscription_helpers.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251123131135_create_wallet_notification_function.sql
echo "✓ Created placeholder: 20251123131135_create_wallet_notification_function.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251124105912_add_booking_notification_enum_values.sql
echo "✓ Created placeholder: 20251124105912_add_booking_notification_enum_values.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251124110205_fix_notification_functions_schema.sql
echo "✓ Created placeholder: 20251124110205_fix_notification_functions_schema.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251124110226_add_wallet_notification_enum_values.sql
echo "✓ Created placeholder: 20251124110226_add_wallet_notification_enum_values.sql"

echo "-- Production migration - already applied" > supabase/migrations/20251125145805_create_admins_table.sql
echo "✓ Created placeholder: 20251125145805_create_admins_table.sql"

echo ""
echo "✅ Step 2 Complete"
echo ""

echo "Step 3: Check current migration status"
echo "---------------------------------------"
npx supabase migration list --linked

echo ""
echo "========================================="
echo "Phase 2 Complete!"
echo "========================================="
echo ""
echo "Review the migration list above."
echo "Migrations marked as 'Local' need to be pushed to production in Phase 3."
echo ""
echo "Next: Proceed to Phase 3 to sync remaining local migrations"
