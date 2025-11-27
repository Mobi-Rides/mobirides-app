#!/bin/bash

set -e

echo "==================================================================="
echo "Migration Sync Fix - Minimal Repair Script"
echo "==================================================================="
echo ""
echo "This script will fix 5 migration mismatches:"
echo "  - Mark 5 migrations as APPLIED in remote history"
echo "  - Remove placeholder files (not needed)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Phase 1: Marking migrations as APPLIED in remote (5 migrations)"
echo "-------------------------------------------------------------------"

echo "Marking 20250103 as applied..."
npx supabase migration repair --status applied 20250103 --linked

echo "Marking first 20250131 as applied..."
npx supabase migration repair --status applied 20250131 --linked

echo "Marking second 20250131 as applied..."
npx supabase migration repair --status applied 20250131 --linked

echo "Marking first 20251120 as applied..."
npx supabase migration repair --status applied 20251120 --linked

echo "Marking second 20251120 as applied..."
npx supabase migration repair --status applied 20251120 --linked

echo ""
echo "Phase 2: Removing placeholder files (if they exist)"
echo "-------------------------------------------------------------------"

if [ -f "supabase/migrations/20250131_production_placeholder.sql" ]; then
    echo "Removing 20250131 placeholder..."
    rm supabase/migrations/20250131_production_placeholder.sql
fi

if [ -f "supabase/migrations/20251120_production_placeholder.sql" ]; then
    echo "Removing 20251120 placeholder..."
    rm supabase/migrations/20251120_production_placeholder.sql
fi

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
