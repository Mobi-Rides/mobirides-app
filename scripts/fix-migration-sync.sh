#!/bin/bash

set -e

echo "==================================================================="
echo "Migration Sync Fix - Minimal Repair Script"
echo "==================================================================="
echo ""
echo "This script will fix 5 migration mismatches:"
echo "  - Mark 3 local-only migrations as REVERTED"
echo "  - Create 2 placeholder files for production migrations"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Phase 1: Marking local-only migrations as REVERTED (3 migrations)"
echo "-------------------------------------------------------------------"

echo "Marking 20250103 as reverted..."
npx supabase migration repair --status reverted 20250103 --linked

echo "Marking 20250131 as reverted..."
npx supabase migration repair --status reverted 20250131 --linked

echo "Marking 20251120 as reverted..."
npx supabase migration repair --status reverted 20251120 --linked

echo ""
echo "Phase 2: Creating placeholder files for production migrations"
echo "-------------------------------------------------------------------"

echo "Creating placeholder for 20250131..."
echo "-- Placeholder for production migration 20250131" > supabase/migrations/20250131_production_placeholder.sql

echo "Creating placeholder for 20251120..."
echo "-- Placeholder for production migration 20251120" > supabase/migrations/20251120_production_placeholder.sql

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
