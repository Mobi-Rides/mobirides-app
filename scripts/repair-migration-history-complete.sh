#!/bin/bash
# Complete Migration History Repair Script
# This script repairs the migration history mismatch between local and production

set -e

echo "========================================="
echo "Migration History Repair - Complete"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Mark 7 migrations as 'reverted' (not applied in production)"
echo "2. Mark 107 migrations as 'applied' (applied in production)"
echo "3. Verify the repair was successful"
echo ""

read -p "Ready to proceed? (yes/no): " ready

if [ "$ready" != "yes" ]; then
  echo "❌ Repair cancelled by user"
  exit 1
fi

echo ""
echo "Phase 1: Marking migrations as REVERTED (7 migrations)"
echo "--------------------------------------------------------"

npx supabase migration repair --status reverted 20241220 --linked
npx supabase migration repair --status reverted 20241220000002 --linked
npx supabase migration repair --status reverted 20241230 --linked
npx supabase migration repair --status reverted 20250103 --linked
npx supabase migration repair --status reverted 20250120000006 --linked
npx supabase migration repair --status reverted 20251024100000 --linked
npx supabase migration repair --status reverted 20251127063521 --linked

echo ""
echo "✅ Phase 1 Complete: 7 migrations marked as reverted"
echo ""
echo "Phase 2: Marking migrations as APPLIED (107 migrations)"
echo "--------------------------------------------------------"

npx supabase migration repair --status applied 20250101000001 --linked
npx supabase migration repair --status applied 20250101000002 --linked
npx supabase migration repair --status applied 20250101000003 --linked
npx supabase migration repair --status applied 20250101000004 --linked
npx supabase migration repair --status applied 20250101000005 --linked
npx supabase migration repair --status applied 20250103 --linked
npx supabase migration repair --status applied 20250117000000 --linked
npx supabase migration repair --status applied 20250120000002 --linked
npx supabase migration repair --status applied 20250120000003 --linked
npx supabase migration repair --status applied 20250120000007 --linked
npx supabase migration repair --status applied 20250120000008 --linked
npx supabase migration repair --status applied 20250120120001 --linked
npx supabase migration repair --status applied 20250129000000 --linked
npx supabase migration repair --status applied 20250129000001 --linked
npx supabase migration repair --status applied 20250129000003 --linked
npx supabase migration repair --status applied 20250129000004 --linked
npx supabase migration repair --status applied 20250129000006 --linked
npx supabase migration repair --status applied 20250130000017 --linked
npx supabase migration repair --status applied 20250130000018 --linked
npx supabase migration repair --status applied 20250130000019 --linked
npx supabase migration repair --status applied 20250130000020 --linked
npx supabase migration repair --status applied 20250130000021 --linked
npx supabase migration repair --status applied 20250130000022 --linked
npx supabase migration repair --status applied 20250130000023 --linked
npx supabase migration repair --status applied 20250130000025 --linked
npx supabase migration repair --status applied 20250130000026 --linked
npx supabase migration repair --status applied 20250130000029 --linked
npx supabase migration repair --status applied 20250130000030 --linked
npx supabase migration repair --status applied 20250130000031 --linked
npx supabase migration repair --status applied 20250130000032 --linked
npx supabase migration repair --status applied 20250131000001 --linked
npx supabase migration repair --status applied 20250131000002 --linked
npx supabase migration repair --status applied 20250131000003 --linked
npx supabase migration repair --status applied 20250131 --linked
npx supabase migration repair --status applied 20250201 --linked
npx supabase migration repair --status applied 20250723133928 --linked
npx supabase migration repair --status applied 20250724124757 --linked
npx supabase migration repair --status applied 20250724125106 --linked
npx supabase migration repair --status applied 20250724190906 --linked
npx supabase migration repair --status applied 20250725000000 --linked
npx supabase migration repair --status applied 20250725230000 --linked
npx supabase migration repair --status applied 20250726000000 --linked
npx supabase migration repair --status applied 20250726204849 --linked
npx supabase migration repair --status applied 20250726205002 --linked
npx supabase migration repair --status applied 20250726205447 --linked
npx supabase migration repair --status applied 20250728074704 --linked
npx supabase migration repair --status applied 20250728080316 --linked
npx supabase migration repair --status applied 20250728135819 --linked
npx supabase migration repair --status applied 20250728140215 --linked
npx supabase migration repair --status applied 20250728184401 --linked
npx supabase migration repair --status applied 20250728191426 --linked
npx supabase migration repair --status applied 20250728191549 --linked
npx supabase migration repair --status applied 20250728202610 --linked
npx supabase migration repair --status applied 20250728202733 --linked
npx supabase migration repair --status applied 20250729055024 --linked
npx supabase migration repair --status applied 20250729060637 --linked
npx supabase migration repair --status applied 20250729060938 --linked
npx supabase migration repair --status applied 20250729193038 --linked
npx supabase migration repair --status applied 20250729193457 --linked
npx supabase migration repair --status applied 20250807081820 --linked
npx supabase migration repair --status applied 20250808061856 --linked
npx supabase migration repair --status applied 20250808070950 --linked
npx supabase migration repair --status applied 20250808120000 --linked
npx supabase migration repair --status applied 20250812054445 --linked
npx supabase migration repair --status applied 20250817060600 --linked
npx supabase migration repair --status applied 20250819083127 --linked
npx supabase migration repair --status applied 20250823064138 --linked
npx supabase migration repair --status applied 20250824083854 --linked
npx supabase migration repair --status applied 20250824085040 --linked
npx supabase migration repair --status applied 20250824091030 --linked
npx supabase migration repair --status applied 20250824091055 --linked
npx supabase migration repair --status applied 20250824094853 --linked
npx supabase migration repair --status applied 20250824103506 --linked
npx supabase migration repair --status applied 20250824150504 --linked
npx supabase migration repair --status applied 20250824152329 --linked
npx supabase migration repair --status applied 20250824165627 --linked
npx supabase migration repair --status applied 20250824170712 --linked
npx supabase migration repair --status applied 20250824171554 --linked
npx supabase migration repair --status applied 20250824171856 --linked
npx supabase migration repair --status applied 20250824173717 --linked
npx supabase migration repair --status applied 20250824175316 --linked
npx supabase migration repair --status applied 20250824180552 --linked
npx supabase migration repair --status applied 20250824181641 --linked
npx supabase migration repair --status applied 20250827155127 --linked
npx supabase migration repair --status applied 20250906074018 --linked
npx supabase migration repair --status applied 20250908160043 --linked
npx supabase migration repair --status applied 20250908160309 --linked
npx supabase migration repair --status applied 20250908161304 --linked
npx supabase migration repair --status applied 20250912122500 --linked
npx supabase migration repair --status applied 20250923121139 --linked
npx supabase migration repair --status applied 20251018173333 --linked
npx supabase migration repair --status applied 20251019201232 --linked
npx supabase migration repair --status applied 20251024062613 --linked
npx supabase migration repair --status applied 20251024093000 --linked
npx supabase migration repair --status applied 20251024130001 --linked
npx supabase migration repair --status applied 20251103101140 --linked
npx supabase migration repair --status applied 20251118082909 --linked
npx supabase migration repair --status applied 20251120000006 --linked
npx supabase migration repair --status applied 20251120000007 --linked
npx supabase migration repair --status applied 20251120000008 --linked
npx supabase migration repair --status applied 20251120000009 --linked
npx supabase migration repair --status applied 20251120000010 --linked
npx supabase migration repair --status applied 20251120000011 --linked
npx supabase migration repair --status applied 20251120000012 --linked
npx supabase migration repair --status applied 20251120000013 --linked
npx supabase migration repair --status applied 20251120 --linked
npx supabase migration repair --status applied 20251121000000 --linked
npx supabase migration repair --status applied 20251121132515 --linked
npx supabase migration repair --status applied 20251122065754 --linked
npx supabase migration repair --status applied 20251126162938 --linked
npx supabase migration repair --status applied 20251127063522 --linked

echo ""
echo "✅ Phase 2 Complete: 107 migrations marked as applied"
echo ""
echo "Phase 3: Verification"
echo "---------------------"
echo "Listing migration status..."
echo ""

npx supabase migration list --linked

echo ""
echo "========================================="
echo "Migration History Repair Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Run: npx supabase db pull --linked"
echo "2. Review the pulled migration file"
echo "3. Run: npx supabase gen types typescript --linked > src/integrations/supabase/types.ts"
echo ""
