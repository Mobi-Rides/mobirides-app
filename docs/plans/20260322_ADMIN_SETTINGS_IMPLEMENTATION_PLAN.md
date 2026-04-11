# Admin Settings & Business Logic Configuration — Implementation Plan

**Date:** 22 March 2026  
**Sprint:** Week 4, March 2026  
**Status:** DRAFT — Awaiting Review

---

## Problem Statement

Mobi Rides has several business-critical parameters (dynamic pricing rules, commission rates, insurance fees, platform toggles) that are either **hardcoded in the source code** or distributed across isolated database tables with **no admin UI** to manage them. This forces the team to deploy code or run raw SQL to change business logic. The admin sidebar already links to `/admin/settings`, but no page exists behind it.

### Current State Audit

| Parameter | Where It Lives | Configurable by Admin? |
|---|---|---|
| Commission rate (active) | `commission_rates` table (DB) | ❌ No UI — raw DB only |
| Commission fallback (15%) | Hardcoded in `commissionRates.ts:26,33` | ❌ Requires code change |
| Dynamic pricing on/off | Not toggleable — always runs | ❌ N/A |
| 8 pricing rules & multipliers | Hardcoded in `dynamicPricingService.ts:91-197` | ❌ Requires code change |
| Insurance packages & premiums | `insurance_packages` table (DB) | ❌ No UI — raw DB only |
| Insurance claim admin fee (P 150) | Hardcoded in `insuranceService.ts:347` | ❌ Requires code change |
| Loyalty tier thresholds | Hardcoded in `dynamicPricingService.ts:366-369` | ❌ Requires code change |

---

## User Review Required

> [!IMPORTANT]
> **New database tables**: This plan introduces two new tables (`platform_settings`, `dynamic_pricing_rules`) and modifies service-layer code to read from them instead of hardcoded values.

> [!WARNING]
> **Fallback behaviour**: All services will continue to use their current hardcoded defaults if the DB rows are missing or the fetch fails. This is a non-breaking, additive change.

> [!CAUTION]
> **SuperAdmin restriction**: The Settings page and all write RPCs must be gated to `super_admin` role only. Regular admins should have read-only visibility at most.

---

## Proposed Changes

### Component 1 — Database Migration

Creates two new tables and seeds default rows that mirror the current hardcoded values.

#### [NEW] [20260322233400_create_platform_settings_and_pricing_rules.sql](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/supabase/migrations/20260322233400_create_platform_settings_and_pricing_rules.sql)

**Consumer search scope:** New tables — no upstream consumers yet.

```sql
-- Tables created by this migration:
--   1. platform_settings   — key/value store for global platform parameters
--   2. dynamic_pricing_rules — replaces hardcoded pricing rules in dynamicPricingService.ts
--
-- Consumers (after wiring): 
--   src/services/dynamicPricingService.ts
--   src/services/commission/commissionRates.ts
--   src/services/insuranceService.ts
--   src/pages/Admin/AdminSettings.tsx
--   src/hooks/usePlatformSettings.ts
--
-- Impact: Additive only — new tables + seed data. No existing schema changes.
-- Rollback: DROP TABLE IF EXISTS platform_settings; DROP TABLE IF EXISTS dynamic_pricing_rules;
```

**`platform_settings` table schema:**

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `setting_key` | text UNIQUE NOT NULL | e.g. `commission_rate_default`, `insurance_admin_fee`, `dynamic_pricing_enabled` |
| `setting_value` | jsonb NOT NULL | Stores numeric, boolean, or structured value |
| `description` | text | Human-readable description for the admin UI |
| `category` | text NOT NULL | Groups settings: `commission`, `insurance`, `pricing`, `platform` |
| `updated_by` | uuid FK → auth.users | Who last changed it |
| `updated_at` | timestamptz | Auto-updated |
| `created_at` | timestamptz | Auto-set |

**Seed rows (matching current hardcoded values):**

| `setting_key` | `setting_value` | `category` |
|---|---|---|
| `commission_rate_default` | `0.15` | `commission` |
| `dynamic_pricing_enabled` | `true` | `pricing` |
| `insurance_admin_fee_pula` | `150` | `insurance` |
| `loyalty_tier_silver_threshold` | `5` | `pricing` |
| `loyalty_tier_gold_threshold` | `10` | `pricing` |
| `loyalty_tier_platinum_threshold` | `20` | `pricing` |

**`dynamic_pricing_rules` table schema:**

| Column | Type | Description |
|---|---|---|
| `id` | text PK | Slug-style, e.g. `weekend-premium` |
| `name` | text NOT NULL | Display name |
| `type` | text NOT NULL | Rule type enum string |
| `is_active` | boolean DEFAULT true | Admin toggle |
| `multiplier` | numeric(4,2) NOT NULL | e.g. 1.20, 0.90 |
| `priority` | integer NOT NULL | Evaluation order |
| `conditions` | jsonb NOT NULL | Rule-specific conditions |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-updated |

**Seed rows** — all 8 rules from `getDefaultPricingRules()` will be inserted as initial data.

**RLS Policies:**
- `SELECT` → all authenticated users (pricing rules are public info)
- `INSERT / UPDATE / DELETE` → super_admin only via `is_admin()` helper function

**RPCs created:**
- `update_platform_setting(p_key text, p_value jsonb)` — SECURITY DEFINER, super_admin gated
- `get_platform_settings()` — authenticated read

---

### Component 2 — Service Layer Refactoring

Wire existing services to read from the new DB tables instead of hardcoded values.

#### [MODIFY] [commissionRates.ts](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/services/commission/commissionRates.ts)

- Change the hardcoded `0.15` fallback to first attempt reading `commission_rate_default` from `platform_settings` before falling back.
- No breaking change to `getCurrentCommissionRate()` signature.

#### [MODIFY] [dynamicPricingService.ts](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/services/dynamicPricingService.ts)

- Replace `getDefaultPricingRules()` to fetch from `dynamic_pricing_rules` table.
- Keep the current hardcoded array as an in-memory fallback if DB fetch fails.
- Add a check for the `dynamic_pricing_enabled` platform setting — if `false`, return base price unmodified.
- **No changes** to the rule evaluation logic (`evaluateRule`, `evaluateSeasonalRule`, etc.) — only the source of the rules changes.

#### [MODIFY] [insuranceService.ts](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/services/insuranceService.ts)

- In `calculateClaimPayout` (line 347), replace the hardcoded `adminFee: number = 150` default with a DB lookup of `insurance_admin_fee_pula` from `platform_settings`.
- Keep `150` as the final fallback if the lookup fails.

---

### Component 3 — React Hook

#### [NEW] [usePlatformSettings.ts](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/hooks/usePlatformSettings.ts)

Custom hook to fetch and cache platform settings from `platform_settings` table. Exposes:
- `settings` — Record<string, any> keyed by `setting_key`
- `getSetting(key, defaultValue)` — typesafe getter
- `updateSetting(key, value)` — calls the RPC, refreshes cache
- `loading`, `error` state

#### [NEW] [useDynamicPricingRules.ts](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/hooks/useDynamicPricingRules.ts)

Hook for the Admin Settings page to CRUD pricing rules from `dynamic_pricing_rules`.

---

### Component 4 — Admin Settings Page & UI Components

#### [NEW] [AdminSettings.tsx](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/pages/Admin/AdminSettings.tsx)

Full settings management page at `/admin/settings`. Uses `AdminLayout` and `AdminProtectedRoute` wrapper (matching existing pattern from `AdminDashboard.tsx`).

**UI Sections (Tabs or collapsible cards):**

1. **Platform & General**
   - Dynamic pricing global on/off toggle
   - Insurance claim admin fee (P) — numeric input
   - Loyalty tier thresholds — numeric inputs for silver/gold/platinum

2. **Commission Rates**
   - Current active rate display (from `commission_rates` table)
   - Default fallback rate — editable numeric input
   - History table of rate changes (read from `commission_rates`)

3. **Dynamic Pricing Rules**
   - Table of all rules with columns: Name, Type, Multiplier, Active toggle, Priority
   - Inline edit or dialog to modify multiplier/conditions/active state
   - Add new rule button

4. **Insurance Packages** (read + edit view of existing `insurance_packages` table)
   - Package name, premium %, coverage cap, excess, active toggle
   - Edit dialog for each package

Each section's save action calls the appropriate RPC or direct Supabase update, and logs to the audit trail.

#### [NEW] [settings/](file:///c:/Users/Administrator/.cursor/Mobi%20Rides%20v1/src/components/admin/settings/) directory

Sub-components for each settings section:
- `PlatformSettingsSection.tsx`
- `CommissionSettingsSection.tsx`
- `DynamicPricingRulesSection.tsx`
- `InsuranceSettingsSection.tsx`

---

### Component 5 — Router Wiring

#### [MODIFY] Router file (where admin routes are defined)

- Add route: `{ path: "settings", element: <AdminSettings /> }`
- The sidebar link already exists at line 53 of `AdminSidebar.tsx`.

---

## Impact Assessment

### Risk Matrix

| Area | Risk Level | Mitigation |
|---|---|---|
| Commission calculation | 🟡 Medium | Fallback to hardcoded 0.15 if DB unreachable |
| Dynamic pricing | 🟢 Low | Full hardcoded fallback array retained |
| Insurance fee | 🟢 Low | Default param value of 150 stays in function signature |
| Existing bookings | 🟢 None | Only affects future calculations |
| Data migration | 🟢 None | Additive tables only, no ALTER on existing tables |
| RLS security | 🟡 Medium | Write operations gated to super_admin via SECURITY DEFINER RPCs |

### Breaking Changes

**None.** This is entirely additive:
- New tables with seed data matching current hardcoded values
- Service modifications retain original defaults as fallbacks
- New UI page on an already-linked but empty route

### Affected Files Summary

| File | Change Type | Lines Affected |
|---|---|---|
| `supabase/migrations/20260322233400_*.sql` | NEW | ~150 lines |
| `src/services/commission/commissionRates.ts` | MODIFY | ~10 lines |
| `src/services/dynamicPricingService.ts` | MODIFY | ~30 lines |
| `src/services/insuranceService.ts` | MODIFY | ~5 lines |
| `src/hooks/usePlatformSettings.ts` | NEW | ~80 lines |
| `src/hooks/useDynamicPricingRules.ts` | NEW | ~60 lines |
| `src/pages/Admin/AdminSettings.tsx` | NEW | ~100 lines |
| `src/components/admin/settings/*.tsx` | NEW (×4) | ~400 lines total |
| Router file | MODIFY | ~3 lines |

---

## Verification Plan

### Automated Tests

1. **Build verification** — immediately after migration + code changes:
   ```bash
   npm run build
   ```
   Must complete with zero TypeScript errors.

2. **Lint check**:
   ```bash
   npx eslint src/pages/Admin/AdminSettings.tsx src/hooks/usePlatformSettings.ts src/hooks/useDynamicPricingRules.ts src/services/dynamicPricingService.ts src/services/commission/commissionRates.ts src/services/insuranceService.ts
   ```

### Browser Tests

3. **Admin Settings page loads** — navigate to `/admin/settings` while logged in as a super_admin:
   - Verify page renders without console errors
   - Verify all four sections (Platform, Commission, Dynamic Pricing, Insurance) display data
   - Verify the dynamic pricing toggle reflects the `dynamic_pricing_enabled` setting value

4. **Edit a setting** — change the insurance admin fee from P 150 to P 200:
   - Verify the value persists after page refresh
   - Verify the `updated_by` and `updated_at` columns are populated in the DB

5. **Toggle a pricing rule off** — deactivate the "Weekend Premium" rule:
   - Verify the toggle updates in the DB table
   - Verify dynamic pricing calculation no longer applies the weekend multiplier

### Manual Verification

6. **SuperAdmin gate check** — log in as a regular admin (non-super_admin):
   - Verify the Settings page either shows read-only mode or denies write operations
   - Confirm no RPC calls succeed for updating settings

7. **Fallback resilience** — temporarily rename the `platform_settings` table (or use a method to simulate a DB error):
   - Confirm the commission service still returns 0.15
   - Confirm the insurance service still uses P 150
   - Confirm dynamic pricing still uses the hardcoded rules array

> [!NOTE]
> There are no existing automated tests that cover the Admin settings flow (the only test in `__tests__/` is `InteractiveHandoverSheet.test.tsx`). New unit tests for the service-layer fallback behaviour are recommended in a follow-up task.
