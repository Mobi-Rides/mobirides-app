#!/bin/bash

set -e

echo "==================================================================="
echo "Migration Sync Fix - Minimal Repair Script"
echo "==================================================================="
echo ""
echo "This script will fix migration timestamp collisions:"
echo "  - Rename 2 local files to have unique timestamps"
echo "  - Mark the new migration IDs as APPLIED in remote"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Phase 1: Renaming colliding migration files"
echo "-------------------------------------------------------------------"

if [ -f "supabase/migrations/20250131_fix_host_rating_with_car_reviews.sql" ]; then
    echo "Renaming 20250131_fix_host_rating_with_car_reviews.sql to 20250131000004_fix_host_rating_with_car_reviews.sql..."
    mv supabase/migrations/20250131_fix_host_rating_with_car_reviews.sql supabase/migrations/20250131000004_fix_host_rating_with_car_reviews.sql
else
    echo "⚠️  20250131_fix_host_rating_with_car_reviews.sql not found (may already be renamed)"
fi

if [ -f "supabase/migrations/20251120_fix_audit_logs_rls_v2.sql" ]; then
    echo "Renaming 20251120_fix_audit_logs_rls_v2.sql to 20251120000014_fix_audit_logs_rls_v2.sql..."
    mv supabase/migrations/20251120_fix_audit_logs_rls_v2.sql supabase/migrations/20251120000014_fix_audit_logs_rls_v2.sql
else
    echo "⚠️  20251120_fix_audit_logs_rls_v2.sql not found (may already be renamed)"
fi

echo ""
echo "Phase 2: Marking new migration IDs as applied in remote"
echo "-------------------------------------------------------------------"

echo "Marking 20250131000004 as applied..."
npx supabase migration repair --status applied 20250131000004 --linked

echo "Marking 20251120000014 as applied..."
npx supabase migration repair --status applied 20251120000014 --linked

echo ""
echo "Phase 3: Verification"
echo "-------------------------------------------------------------------"
echo "Running migration list to verify sync..."
npx supabase migration list --linked

echo ""
echo "==================================================================="
echo "✓ Migration sync complete!"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "  1. npx supabase db pull --linked"
echo "  2. npx supabase gen types typescript --linked > src/integrations/supabase/types.ts"
echo ""
