

# Fix: Consistent Pricing Breakdown Across All Screens

## Problem

Multiple screens display pricing inconsistently:

1. **RenterPaymentModal** uses `variant="compact"` (shows only the total, no line items) and hardcodes `insurancePremium={0}` and `discountAmount={0}` with TODO comments, even though the booking object has these fields.

2. **Rental Details page** (RentalPaymentDetails) shows the breakdown but is missing the insurance package name -- it just says "Insurance Premium" generically.

3. **Booking flow (Step 4)** shows the full breakdown correctly via `UnifiedPriceSummary` with `variant="full"`, but the same data is lost when viewing the booking later because the payment modal and details page don't pull the stored values.

## Fix

### 1. RenterPaymentModal -- Show full breakdown with stored data

**File:** `src/components/booking/RenterPaymentModal.tsx`

- Change `variant="compact"` to `variant="full"` so the payment modal shows the same line-item breakdown as the booking wizard
- Replace hardcoded `insurancePremium={0}` and `discountAmount={0}` with actual values from `booking.insurance_premium` and `booking.discount_amount`
- Construct `dynamicPricing` object from `booking.dynamic_pricing_multiplier` (same pattern used in ReceiptModal and RentalPaymentDetails)
- Also fix the `handlePay` function to use stored booking values instead of re-deriving them incorrectly

### 2. RentalPaymentDetails -- Show insurance package name

**File:** `src/components/rental-details/RentalPaymentDetails.tsx`

- Add `insurancePackageName` prop and pass it through to `UnifiedPriceSummary`

**File:** `src/pages/RentalDetailsRefactored.tsx`

- Look up the insurance package name from the booking's `insurance_policy_id` and pass it to `RentalPaymentDetails`
- If no policy is linked, fall back to the generic label

### 3. Remove dead PriceBreakdown component

**File:** `src/components/booking/PriceBreakdown.tsx`

- This component is not imported or used anywhere. Remove it to reduce confusion about which price display component to use (the answer is always `UnifiedPriceSummary`).

## Technical Details

### RenterPaymentModal changes

```
// Before (broken):
insurancePremium={0}  // TODO
discountAmount={0}    // TODO
variant="compact"

// After (correct):
insurancePremium={booking.insurance_premium || 0}
discountAmount={booking.discount_amount || 0}
dynamicPricing={dynamicPricing}  // constructed from booking.dynamic_pricing_multiplier
variant="full"
```

### RentalDetailsRefactored changes

Query the insurance policy's package name via the booking's `insurance_policy_id` to display "Basic Protection" / "Standard Protection" / "Premium Protection" instead of the generic "Insurance Premium" label.

### Summary

| File | Change |
|------|--------|
| RenterPaymentModal.tsx | Use `variant="full"`, read real insurance/discount/dynamic values from booking |
| RentalPaymentDetails.tsx | Accept and forward `insurancePackageName` prop |
| RentalDetailsRefactored.tsx | Look up insurance package name and pass it down |
| PriceBreakdown.tsx | Delete unused component |

