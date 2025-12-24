I will implement the **Insurance Integration Plan (Version 2.0)** as defined in the documentation. This involves a comprehensive update to the database schema, service layer, and UI components to support rental-amount-based premiums and actual Botswana insurance terms.

### **Phase 1: Database & Infrastructure**
1.  **Create Migration File**: `supabase/migrations/20251224000000_implement_insurance_schema.sql`
    *   **Tables**: `insurance_packages`, `insurance_policies`, `insurance_claims`, `insurance_claim_activities`.
    *   **Storage**: Create buckets `insurance-policies` and `insurance-claims` with RLS policies.
    *   **Functions**: Add helpers for policy/claim number generation.
    *   **Seed Data**: Insert the 4 defined packages (No Coverage, Basic, Standard, Premium) with correct Botswana Pula limits and exclusions.

### **Phase 2: Service Layer**
2.  **Update `src/services/insuranceService.ts`**
    *   Implement `InsuranceService` class.
    *   Add methods: `calculatePremium` (client-side formula), `createPolicy`, `getInsurancePackages`.
    *   Define TypeScript interfaces for `PremiumCalculation`, `InsurancePolicy`, etc.

### **Phase 3: UI Components & Integration**
3.  **Create `src/components/insurance/InsurancePackageSelector.tsx`**
    *   Implement the rich UI with 4 comparison cards.
    *   Add "Select This Coverage" functionality.
    *   Display dynamic premiums based on rental duration and car price.
    *   Show detailed coverage inclusions/exclusions (accordion style).

4.  **Update `src/components/booking/BookingDialog.tsx`**
    *   Replace existing `InsurancePlanSelector` with the new `InsurancePackageSelector`.
    *   Update booking state to track `selectedPackageId`.
    *   **Logic Change**: Include insurance premium in the `totalPrice` calculation.
    *   **Post-Booking Action**: Call `InsuranceService.createPolicy()` immediately after a successful booking insertion.

### **Verification**
*   Ensure the migration applies successfully (I will review the SQL).
*   Verify the Service layer types match the database schema.
*   Confirm the Booking Dialog correctly calculates totals and handles the policy creation flow.
