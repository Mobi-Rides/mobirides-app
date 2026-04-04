

# Admin Settings Overhaul: Dynamic Pricing + Insurance SLA v1.1

## Overview

Four changes to align Admin Settings with the PRD and Pay-U SLA v1.1:
1. Fix build error in `useDynamicPricingRules.ts`
2. Rewrite `DynamicPricingRulesSection.tsx` with all 8 rule types including DESTINATION
3. Rewrite `InsuranceSettingsSection.tsx` to match SLA v1.1 exactly
4. Wire both sections to Supabase (replace fake `setTimeout` saves)

---

## Change 1: Fix `useDynamicPricingRules.ts` Build Error

The hook already maps fields correctly between app types (`name`/`type`/`conditions`) and DB columns (`rule_name`/`condition_type`/`condition_value`). However, the `dynamic_pricing_rules` type reference may fail if the generated types are stale. The fix is to use `as any` cast on `.from('dynamic_pricing_rules')` calls, consistent with the project's existing pattern for tables not always present in type generation.

**File:** `src/hooks/useDynamicPricingRules.ts`
- Remove the `DbPricingRuleRow/Insert/Update` type aliases that depend on generated types
- Use `as any` on `.from()` calls (matches existing project pattern)
- Add a `deleteRule` function (needed for the rewritten UI)

---

## Change 2: Rewrite `DynamicPricingRulesSection.tsx`

**Current problems:**
- Only supports `surge` | `discount` rule types
- Hardcoded conditions (`saturday_sunday`, `high_demand`, etc.)
- No DESTINATION rule type (local / out_of_zone / cross_border)
- Uses local state, not Supabase
- Uses its own `PricingRule` interface instead of shared types

**Rewrite to:**
- Import `PricingRuleType` from `@/types/pricing`
- Use `useDynamicPricingRules` hook for CRUD
- Rule type selector with all 8 types: SEASONAL, DEMAND, EARLY_BIRD, LOYALTY, WEEKEND, HOLIDAY, LOCATION, **DESTINATION**
- Conditional form fields per rule type:
  - **DESTINATION**: dropdown for `local` (1.0x) / `out_of_zone` (1.5x) / `cross_border` (2.0x)
  - **SEASONAL**: month multi-select
  - **WEEKEND**: day-of-week checkboxes
  - **EARLY_BIRD**: advance days input
  - **LOYALTY**: min bookings + tier selector
  - **DEMAND**: threshold percentage
  - **HOLIDAY**: date range picker
  - **LOCATION**: region/city text inputs
- Loading/error states from the hook
- Save/delete wired to Supabase

---

## Change 3: Rewrite `InsuranceSettingsSection.tsx` to Match SLA v1.1

**Current vs SLA v1.1:**

| Field | Current (Wrong) | SLA v1.1 (Correct) |
|-------|-----------------|---------------------|
| Basic daily rate | P49 | **P80/day** |
| Basic cap | P25,000 | **P8,000** |
| Basic excess | P5,000 flat | **20% of claim** |
| Standard daily rate | P99 | **P150/day** |
| Standard cap | P50,000 | **P20,000** |
| Standard excess | P2,500 flat | **15% of claim** |
| Premium daily rate | P149 | **P250/day** |
| Premium cap | P100,000 | **P50,000** |
| Premium excess | P1,500 flat | **10% of claim** |

**Rewrite to include:**
- **4 tiers**: No Coverage (read-only, P0), Basic, Standard, Premium
- **Excess as percentage** (20% / 15% / 10%) — new input field
- **Target segment** per tier (e.g., "Short-term city rentals")
- **SLA Terms card** (read-only): revenue split (90/10), admin fee (P150), international cap ($8,000 USD), auto-approval threshold (≤P500)
- **Coverage inclusions/exclusions** display from SLA sections 3.3/3.4
- **Summary table** updated: shows excess as percentage, daily rate in BWP
- Wire to `insurance_packages` table via Supabase

**DB schema gap:** The `insurance_packages` table has `premium_percentage` and `excess_amount` (flat) but the SLA needs `daily_rate` and `excess_percentage`. A migration will add these columns.

---

## Change 4: Database Migration

Add columns to `insurance_packages` to support the SLA structure:

```sql
ALTER TABLE insurance_packages
  ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excess_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_segment text,
  ADD COLUMN IF NOT EXISTS international_cap_usd numeric DEFAULT 8000;
```

No new tables needed. `dynamic_pricing_rules` table already exists with the correct schema.

---

## Files Modified

| File | Action |
|------|--------|
| `src/hooks/useDynamicPricingRules.ts` | Fix types, add `deleteRule` |
| `src/components/admin/settings/DynamicPricingRulesSection.tsx` | Full rewrite |
| `src/components/admin/settings/InsuranceSettingsSection.tsx` | Full rewrite |
| Migration: `insurance_packages` schema | Add 4 columns |

## Risk

- `dynamic_pricing_rules` table uses `as any` cast (existing pattern) — will work at runtime but no compile-time type checking
- Insurance data currently in DB may have `premium_percentage` populated but not `daily_rate` — the UI will show fallback defaults until admin saves correct values

