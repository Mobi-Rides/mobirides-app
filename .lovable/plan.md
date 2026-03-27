

## Plan: Regenerate Supabase Types and Fix Build Errors

### Step 1: Regenerate Supabase types
Run the Supabase type generation to pull in `platform_settings`, `dynamic_pricing_rules`, and their associated RPCs (`get_platform_settings`, `update_platform_setting`) into `src/integrations/supabase/types.ts`. This should resolve all 20+ type errors across `useDynamicPricingRules.ts`, `usePlatformSettings.ts`, `commissionRates.ts`, `dynamicPricingService.ts`, and `insuranceService.ts`.

### Step 2: Remove "Modify Booking" button from `RentalActions.tsx`
Remove the entire block (lines ~103-117) that renders the "Modify Booking" button and references `handleModifyBooking`. This eliminates the `TS2304: Cannot find name 'handleModifyBooking'` error.

### Step 3: Verify build
After type regeneration and the button removal, check for any remaining type mismatches (e.g., `.forEach` on RPC return, `.setting_value` property access) and fix if the regenerated types reveal different shapes than what the code expects.

