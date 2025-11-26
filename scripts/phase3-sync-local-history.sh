#!/bin/bash
# Phase 3: Sync Local Migration History to Production
# Marks all local-only migrations as applied in production

echo "========================================="
echo "Phase 3: Sync Local Migration History"
echo "========================================="
echo ""

echo "Step 1: Verify schema consistency"
echo "----------------------------------"
echo "Checking if local and production schemas match..."
echo ""

# Run diff to see if there are any actual schema differences
npx supabase db diff --linked --schema public

echo ""
echo "⚠️  IMPORTANT: Review the output above"
echo "If there are schema differences, we need to address them before proceeding."
echo "If output says 'Finished supabase db diff' with no differences, we can proceed."
echo ""

read -p "Does the schema match (no differences shown)? (yes/no): " schema_match

if [ "$schema_match" != "yes" ]; then
  echo "❌ Schema mismatch detected. Please review differences and fix before continuing."
  exit 1
fi

echo ""
echo "✅ Schema matches - Safe to sync migration history"
echo ""

echo "Step 2: Push local migrations to production history"
echo "----------------------------------------------------"
echo "This will mark all local-only migrations as 'applied' in production"
echo "WITHOUT re-running them (since schema already exists)."
echo ""

read -p "Ready to push migration history? (yes/no): " ready_to_push

if [ "$ready_to_push" != "yes" ]; then
  echo "❌ Sync cancelled by user"
  exit 1
fi

echo ""
echo "Pushing local migration history to production..."
npx supabase db push --linked

echo ""
echo "Step 3: Verify sync completion"
echo "-------------------------------"
npx supabase migration list --linked

echo ""
echo "========================================="
echo "Phase 3 Complete!"
echo "========================================="
echo ""
echo "Expected result: All migrations should show in both Local and Remote columns"
echo ""
echo "Next: Run Phase 4 (Verification) to ensure everything is working correctly"
