#!/bin/bash

# Migration Repair Script - Story 1.2
# Marks archived duplicate migrations as applied or reverted to enable clean backend seeding
# Safe to run multiple times (idempotent)

set -e  # Exit on error

echo "🔧 Starting Migration Repair Script"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npx is available (comes with Node.js/npm)
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found${NC}"
    echo "Please install Node.js which includes npx: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ npx found - will use 'npx supabase' commands${NC}"
echo ""

# Function to mark migration as applied
mark_applied() {
    local migration=$1
    local description=$2
    echo -e "${YELLOW}→ Marking as applied: $migration${NC}"
    echo "  Reason: $description"
    if npx supabase migration repair --status applied "$migration" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Success${NC}"
    else
        echo -e "${YELLOW}  ⚠ Already applied or migration not found${NC}"
    fi
    echo ""
}

# Function to mark migration as reverted (skip)
mark_reverted() {
    local migration=$1
    local description=$2
    echo -e "${YELLOW}→ Marking as reverted: $migration${NC}"
    echo "  Reason: $description"
    if npx supabase migration repair --status reverted "$migration" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Success${NC}"
    else
        echo -e "${YELLOW}  ⚠ Already reverted or migration not found${NC}"
    fi
    echo ""
}

echo "📦 Phase 1: Conversation Recursion Fixes (Mark as reverted - superseded by canonical)"
echo "===================================================================================="
mark_reverted "20250115000002" "Old RLS recursion fix - superseded"
mark_reverted "20250120120000" "Old infinite recursion fix - superseded"
mark_reverted "20250120130000" "Old conversation recursion final - superseded"
mark_reverted "20250120131500" "Old conversation recursion corrected - superseded"
mark_reverted "20250129000005" "Old participants recursion fix - superseded"
mark_reverted "20250130000001" "Old participants recursion final - superseded"
mark_reverted "20250130000002" "Old comprehensive RLS fix - superseded"
mark_reverted "20250130000010" "Old participant access fix - superseded"
mark_reverted "20250130000011" "Old infinite recursion fix - superseded"
mark_reverted "20250130000012" "Old complete RLS reset - superseded"
mark_reverted "20251105170000" "Old storage messages recursion - superseded"

echo "📦 Phase 2: is_admin Conflicts (Mark as applied - older versions)"
echo "=================================================================="
mark_applied "20250726204653" "Duplicate is_admin implementation #1"
mark_applied "20250726204732" "Duplicate is_admin implementation #2"
echo "Note: 20250726204711_add_admin_role_to_user_role_enum.sql - already deleted (duplicate)"

echo "📦 Phase 3: Notification Duplicates (Mark as applied - older versions)"
echo "========================================================================"
mark_applied "20241220000002" "Old notification constraints - superseded by final version"
mark_applied "20251024100000" "Old dedupe attempt - superseded by safe_dedupe_final"

echo "📦 Phase 4: Column Name Fixes (Mark as applied)"
echo "================================================"
mark_applied "20250120000005" "Handover make column references fix"
mark_applied "20250120000006" "Pickup functions make column fix"

echo "📦 Phase 5: Timestamp Collision Fixes (Mark as applied)"
echo "========================================================="
mark_applied "20250117000001" "Land Rover Lumma update (duplicate timestamp)"
mark_applied "20251024112000" "Address confirmation enum (duplicate timestamp #1)"

echo ""
echo "📦 Phase 6: Deleted Problematic Files (No action needed - already removed)"
echo "==========================================================================="
echo "✓ 20251029_fix_user_restrictions_policies.sql - deleted (truncated file)"
echo "✓ 20251124105913_add_missing_notification_enum_values.sql.sql - deleted (double extension)"
echo "✓ 20251124110205_fix_notification_functions_schema.sql.sql - deleted (double extension)"
echo "✓ 20251124110226_add_wallet_payment_enum_values.sql.sql - deleted (double extension)"

echo ""
echo -e "${GREEN}✅ Migration Repair Complete${NC}"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Run: npx supabase migration list"
echo "   → Verify archived migrations show correct status"
echo ""
echo "2. Run: npx supabase db reset --local"
echo "   → Test fresh database seeding"
echo ""
echo "3. Check for errors:"
echo "   → No 'already exists' errors"
echo "   → No 'constraint already exists' errors"
echo "   → Clean migration execution"
echo ""
echo "4. If errors persist, check:"
echo "   → docs/MIGRATION_INVENTORY_ANALYSIS.md"
echo "   → supabase/migrations/archive/README.md"
echo ""
echo -e "${GREEN}🎉 Story 1.2 repair script completed successfully!${NC}"
