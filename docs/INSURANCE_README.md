# Insurance Implementation - README

## Overview

The MobiRides insurance system is a comprehensive, production-ready implementation providing rental car insurance coverage with four tiers of protection. The system supports the complete lifecycle from package selection through claim processing and payout.

## Status: ✅ 100% COMPLETE

**Completion Date**: December 24, 2025  
**Implementation Time**: 8 weeks  
**Production Ready**: Yes

## Quick Start

### For Developers

```bash
# Install dependencies
npm install

# Run verification script (New!)
npx tsx src/scripts/test_insurance_features.ts

# Run standard tests
npm test

# Build the application
npm run build

# Deploy Edge Functions
npx supabase functions deploy calculate-insurance

# Run database migrations
npx supabase db push
```

### For Users

Insurance selection is integrated into the booking flow at `BookingDialog.tsx`. When `INSURANCE_V2` feature flag is enabled (default: true), users see insurance package options during booking.

## Architecture

### Components

```
Insurance System
│
├── Database Layer
│   ├── insurance_packages (4 seed packages)
│   ├── insurance_policies (booking-linked policies)
│   ├── insurance_claims (claim management)
│   └── insurance_claim_activities (audit trail)
│
├── Backend Services
│   ├── insuranceService.ts (Core logic)
│   ├── underwriterService.ts (Risk assessment)
│   ├── insurance/automationService.ts (Expiry & Auto-approval)
│   ├── walletService.ts (payout integration)
│   └── Edge Function: calculate-insurance
│
├── Frontend Components
│   ├── InsurancePackageSelector.tsx (package selection UI)
│   ├── ClaimsSubmissionForm.tsx (claim submission)
│   ├── UserClaimsList.tsx (user claim history)
│   ├── AdminClaimsDashboard.tsx (admin management)
│   ├── InsuranceComparison.tsx (comparison modal)
│   └── PolicyDetailsCard.tsx (policy details)
│
└── Integrations
    ├── Booking Flow (BookingDialog.tsx)
    ├── PDF Generation (pdfGenerator.ts)
    ├── Storage (Supabase buckets)
    └── Wallet (claim payouts)
```

## Insurance Packages

### 1. No Coverage (0%)
- **Premium**: P 0.00
- **Coverage**: None
- **Use Case**: Renters with existing insurance

### 2. Basic Coverage (25%)
- **Premium**: 25% of rental amount
- **Coverage Cap**: P 15,000
- **Excess**: P 300
- **Covers**: Minor damage (windscreen, windows, tyres)

### 3. Standard Coverage (50%)
- **Premium**: 50% of rental amount
- **Coverage Cap**: P 50,000
- **Excess**: P 1,000
- **Covers**: Minor + major incidents (collision, theft, vandalism, fire, weather)

### 4. Premium Coverage (100%)
- **Premium**: 100% of rental amount
- **Coverage Cap**: P 50,000
- **Excess**: P 500 (reduced)
- **Covers**: Same as Standard + priority service

## Premium Calculation Formula

```typescript
Premium = Daily Rental Rate × Premium Percentage × Number of Days × Risk Multiplier
```

**Example**:
- Rental: P 500/day × 7 days = P 3,500
- Standard Package (50%): P 500 × 0.50 × 7 = P 1,750
- High Risk Driver (1.5x load): P 1,750 × 1.5 = **P 2,625 Total Premium**

## Key Features

### ✅ Automated Policy Generation
- Policies created automatically on booking confirmation
- Professional PDF documents with jsPDF
- Auto-upload to Supabase Storage (`insurance-policies` bucket)
- Public URLs stored in database

### ✅ Claims Management
- Multi-step claim submission form
- Evidence upload (photos, repair quotes)
- Police report tracking
- Admin review dashboard
- Status workflow: submitted → under_review → approved/rejected → paid

### ✅ Wallet Integration
- Approved claims credit user wallets automatically
- Transaction type: `insurance_payout`
- Full audit trail in `wallet_transactions`
- Automated notifications

### ✅ Policy Automation
- **Policy Expiration**: Automated checks for end_date (via `automationService.ts` or pg_cron).
- **Auto-Approval**: Small claims (< P500) are automatically approved by the system.
- **User Response**: Users can dispute/respond to "More Info Needed" requests via the UI.

## API Reference

### Insurance Service

```typescript
// Get all active packages
const packages = await InsuranceService.getInsurancePackages();

// Calculate premium for a package
const calculation = await InsuranceService.calculatePremium(
  packageId,
  dailyRentalAmount,
  startDate,
  endDate
);

// Create policy (called during booking)
const policy = await InsuranceService.createPolicy(
  bookingId,
  packageId,
  renterId,
  carId,
  startDate,
  endDate,
  dailyRentalAmount
);

// Submit claim
await InsuranceService.submitClaim({
  policy_id: policyId,
  booking_id: bookingId,
  renter_id: renterId,
  incident_date: incidentDate,
  incident_type: 'collision',
  incident_description: 'Description...',
  damage_description: 'Damage details...',
  estimated_damage_cost: 5000
});

// Process claim payout (admin)
await InsuranceService.processClaimPayout(claimId, payoutAmount);
```

### Edge Function

**Endpoint**: `/calculate-insurance`

**Request**:
```json
{
  "dailyRentalAmount": 500,
  "premiumPercentage": 0.50,
  "numberOfDays": 7
}
```

**Response**:
```json
{
  "premiumPerDay": 250.00,
  "totalPremium": 1750.00,
  "numberOfDays": 7,
  "dailyRentalAmount": 500,
  "premiumPercentage": 0.50
}
```

## Database Schema

### insurance_packages
- `id` UUID
- `name` TEXT (no_coverage, basic, standard, premium)
- `premium_percentage` DECIMAL (0.00, 0.25, 0.50, 1.00)
- `coverage_cap` DECIMAL
- `excess_amount` DECIMAL
- `features` TEXT[]
- `exclusions` TEXT[]

### insurance_policies
- `id` UUID
- `policy_number` TEXT (INS-YYYY-XXXXXX)
- `booking_id` UUID → bookings
- `package_id` UUID → insurance_packages
- `renter_id` UUID → auth.users
- `total_premium` DECIMAL
- `status` TEXT (active, expired, cancelled, claimed)
- `policy_document_url` TEXT

### insurance_claims
- `id` UUID
- `claim_number` TEXT (CLM-YYYY-XXXXXX)
- `policy_id` UUID → insurance_policies
- `incident_type` TEXT
- `status` TEXT (submitted, under_review, approved, rejected, paid)
- `approved_amount` DECIMAL
- `payout_amount` DECIMAL
- `evidence_urls` TEXT[]

## File Structure

```
mobirides-app/
├── src/
│   ├── components/
│   │   ├── insurance/
│   │   │   ├── InsurancePackageSelector.tsx
│   │   │   ├── ClaimsSubmissionForm.tsx
│   │   │   ├── UserClaimsList.tsx
│   │   │   ├── AdminClaimsDashboard.tsx
│   │   │   ├── InsuranceComparison.tsx
│   │   │   ├── PolicyDetailsCard.tsx
│   │   │   └── __tests__/
│   │   │       └── insuranceClaims.test.tsx
│   │   └── booking/
│   │       └── BookingDialog.tsx (insurance integration)
│   ├── services/
│   │   ├── insuranceService.ts
│   │   ├── walletService.ts
│   │   └── wallet/
│   │       └── walletOperations.ts
│   ├── types/
│   │   └── insurance-schema.ts
│   ├── utils/
│   │   └── pdfGenerator.ts
│   └── lib/
│       └── featureFlags.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20251201140903_create_insurance_tables.sql
│   │   ├── 20251224000000_implement_insurance_schema.sql
│   │   └── 20251224010000_insurance_expiration_job.sql
│   └── functions/
│       └── calculate-insurance/
│           └── index.ts
└── docs/
    └── insurance-integration-plan-2025-11-12.md
```

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- ✅ Component rendering tests
- ✅ Form validation tests
- ✅ Claims submission flow
- ✅ Admin dashboard rendering
- ⚠️ Integration tests (to be added)
- ⚠️ E2E tests (to be added)

## Deployment

### Prerequisites

1. Supabase project linked
2. Environment variables configured
3. pg_cron extension enabled (for policy expiration)

### Deployment Steps

```bash
# 1. Deploy Edge Functions
npx supabase functions deploy calculate-insurance

# 2. Run database migrations
npx supabase db push

# 3. Enable pg_cron extension (if not already enabled)
# Go to: Supabase Dashboard → Database → Extensions → Enable pg_cron

# 4. Verify feature flag
# Check src/lib/featureFlags.ts → INSURANCE_V2: true

# 5. Build and deploy frontend
npm run build
```

### Post-Deployment Verification

1. Create test booking with insurance
2. Verify policy PDF generation
3. Submit test claim
4. Approve claim and verify wallet credit
5. Monitor Supabase logs for errors

## Monitoring

### Key Metrics to Track

- Insurance attach rate (% of bookings with insurance)
- Average premium per booking
- Policy creation success rate
- PDF generation success rate
- Claim submission volume
- Claim approval rate
- Average claim processing time
- Wallet payout success rate

### Logs to Monitor

```sql
-- Policy creation rate
SELECT DATE(created_at), COUNT(*) 
FROM insurance_policies 
GROUP BY DATE(created_at);

-- Claim status distribution
SELECT status, COUNT(*) 
FROM insurance_claims 
GROUP BY status;

-- Average premium by package
SELECT 
  pkg.name,
  AVG(pol.total_premium) as avg_premium
FROM insurance_policies pol
JOIN insurance_packages pkg ON pkg.id = pol.package_id
GROUP BY pkg.name;
```

## Troubleshooting

### Issue: Policy PDF not generating

**Check**:
1. `generatePolicyPDF` import in insuranceService.ts
2. Supabase Storage bucket `insurance-policies` exists
3. RLS policies allow uploads
4. Check browser console for errors

**Fix**:
- Verify jsPDF and jsPDF-autotable are installed
- Check storage bucket permissions
- Review policy creation logs

### Issue: Claim payout not crediting wallet

**Check**:
1. Wallet exists for user
2. `creditInsurancePayout` method called correctly
3. Transaction recorded in `wallet_transactions`
4. Claim status updated to 'paid'

**Fix**:
- Verify wallet service integration
- Check for errors in `processClaimPayout` logs
- Ensure claim has approved_amount set

### Issue: Policies not expiring automatically

**Check**:
1. pg_cron extension enabled
2. Cron job scheduled: `SELECT * FROM cron.job WHERE jobname = 'expire-policies-hourly'`
3. Function exists: `expire_insurance_policies()`

**Fix**:
- Enable pg_cron in Supabase Dashboard
- Run migration `20251224010000_insurance_expiration_job.sql`
- Manually run: `SELECT expire_insurance_policies()`

## Support

### Documentation
- Implementation Plan: `docs/insurance-integration-plan-2025-11-12.md`
- API Documentation: See "API Reference" section above
- Database Schema: See "Database Schema" section above

### Contact
For technical issues or questions, refer to the main project documentation.

## License

Same as MobiRides main application.

---

**Last Updated**: December 24, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
