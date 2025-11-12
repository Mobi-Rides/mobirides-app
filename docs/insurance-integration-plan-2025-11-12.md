# MobiRides Insurance Integration Plan (UPDATED)
**Epic**: MOBI-INS-001  
**Created**: October 28, 2025  
**Updated**: November 12, 2025  
**Status**: Implementation Phase  
**Priority**: Critical-High  
**Estimated Timeline**: 12 working days (2-3 weeks)  
**Revenue Impact**: +30-40% per booking

---

## 📋 Document Updates

### Changes in Version 2.0 (November 12, 2025)
- ✅ **Premium Formula**: Changed from vehicle-value-based to **rental-amount-based calculation**
- ✅ **Insurance Terms**: Updated to match actual **Botswana Mobi_Rides Renters Terms & Conditions**
- ✅ **Package Structure**: Simplified to 4 clear tiers (No Coverage, Basic, Standard, Premium)
- ✅ **Pricing Model**: Now uses percentage of rental amount (0%, 25%, 50%, 100%)
- ✅ **Coverage Details**: Aligned with actual policy documents and exclusions
- ✅ **Admin Fees**: Added P 150 administrative fee per claim
- ✅ **Timeline**: Reduced from 22 to 12 days with simplified approach

---

## Executive Summary

### Current State: 0% Complete
- ❌ No insurance packages defined
- ❌ No insurance selection in booking flow
- ❌ No insurance pricing or policy management
- ❌ No claims management system
- ❌ Missing competitive feature vs market leaders

### Business Impact
- **Revenue Opportunity**: Estimated P 15,000-25,000/month from insurance premiums
- **Competitive Advantage**: Industry standard feature alignment
- **Risk Management**: Formal insurance framework reduces platform liability
- **User Confidence**: Professional insurance offering builds trust

### Success Criteria
- ✅ 30%+ insurance attach rate within first month
- ✅ P 300-600 average premium per booking (based on 7-day rental at P 500-1000/day)
- ✅ <5% claim dispute rate
- ✅ Complete claims processing within 48 hours
- ✅ Zero insurance-related booking failures

---

## 🎯 Key Implementation Changes

### Old Approach (October 28, 2025)
- ❌ Complex vehicle-value-based premium calculation
- ❌ Fixed daily rates (P 35, P 60, P 95 per day)
- ❌ Required vehicle valuation maintenance
- ❌ Generic coverage descriptions
- ❌ No alignment with actual insurance terms

### New Approach (November 12, 2025)
- ✅ **Simple rental-amount formula**: `Premium = Rental Amount × Percentage × Days`
- ✅ **Percentage-based rates**: 0%, 25%, 50%, 100% of rental amount
- ✅ **No vehicle valuation needed**: Scales automatically with rental price
- ✅ **Actual Botswana terms**: Matches Mobi_Rides official insurance policy
- ✅ **Clear coverage tiers**: Based on real-world insurance document

### Why This Is Better
| Aspect | Old Method | New Method | Benefit |
|--------|-----------|-----------|---------|
| **Complexity** | Vehicle value × risk factor × days | Rental amount × percentage × days | Simpler calculation |
| **Transparency** | Opaque pricing | Users see clear % of rental | Better UX |
| **Maintenance** | Update vehicle values regularly | Zero maintenance | Less overhead |
| **Scalability** | Different rates per vehicle category | Works for any rental price | Universal |
| **Accuracy** | Generic industry terms | Actual Botswana policy | Legal compliance |

---

## 📊 Insurance Package Structure (Based on Actual Terms)

### Package 1: No Coverage
```yaml
Name: No Coverage
Display Name: "No Coverage - Full Liability"
Premium Percentage: 0% (P 0.00)
Coverage Cap: N/A
Excess: N/A

Description: |
  You are fully responsible for all damages and losses to the vehicle.
  This option has the lowest upfront cost but carries unlimited liability.

Covers:
  - Nothing

Liability:
  - Full replacement cost if vehicle is stolen or totaled
  - All repair costs for any damage (minor or major)
  - All third-party claims
  - All administrative costs

Best For:
  - Experienced renters with existing comprehensive insurance
  - Short-term local rentals with minimal risk
  - Budget-conscious users willing to accept full risk
```

### Package 2: Basic Coverage
```yaml
Name: Basic Coverage
Display Name: "Basic - Minor Damage Protection"
Premium Percentage: 25% of daily rental amount
Coverage Cap: P 15,000 per incident
Excess Per Claim: P 300
Admin Fee Per Claim: P 150

Formula Example:
  Rental: P 500/day × 7 days = P 3,500
  Premium: P 500 × 25% × 7 days = P 875
  Total: P 4,375

Description: |
  Protection for minor damages including windscreen, windows, and tyres.
  Ideal for renters who want basic peace of mind without major expense.

Covers (Minor Damage):
  ✓ Windscreen damage (cracks, chips, breaks)
  ✓ Front and rear window damage
  ✓ Tyre damage (punctures, blowouts, cuts)
  ✓ Coverage capped at P 15,000 per incident
  
Claim Process:
  - Renter pays: P 300 excess + P 150 admin fee
  - Insurance covers: Remaining damage cost up to P 15,000
  - Example: P 2,000 windscreen = Renter pays P 450, Insurance pays P 1,550

Does NOT Cover (Major Incidents):
  ✗ Collision damage
  ✗ Theft of vehicle or parts
  ✗ Vandalism
  ✗ Fire damage
  ✗ Weather-related damage (hail, flood)
  ✗ Third-party liability

Exclusions (All Packages):
  ✗ Pre-existing damage not documented at pickup
  ✗ Rim and wheel damage (tyres only)
  ✗ Damage while under influence (DUI)
  ✗ Unauthorized drivers not listed on rental agreement
  ✗ Racing, rallying, or illegal activities
  ✗ Use outside authorized geographical areas
  ✗ Normal wear and tear
  ✗ Mechanical or electrical failures
  ✗ Improper vehicle use or maintenance neglect
  ✗ Personal belongings of renter
  ✗ Key loss or lockout services
  ✗ Wrong fuel type
  ✗ Underbody damage from off-road use

Best For:
  - City driving with minimal collision risk
  - Renters concerned about glass/tyre damage
  - Budget-conscious protection seekers
```

### Package 3: Standard Coverage
```yaml
Name: Standard Coverage
Display Name: "Standard - Comprehensive Protection"
Premium Percentage: 50% of daily rental amount
Coverage Cap: P 50,000 per incident
Excess Per Claim: P 1,000
Admin Fee Per Claim: P 150

Formula Example:
  Rental: P 2,000/day × 7 days = P 14,000
  Premium: P 2,000 × 50% × 7 days = P 7,000
  Total: P 21,000

Description: |
  Comprehensive protection for major incidents including collision, theft, 
  vandalism, fire, and weather damage. Includes everything from Basic plus major incident coverage.

Covers (Minor Damage - Same as Basic):
  ✓ Windscreen, windows, and tyre damage
  
Covers (Major Incidents):
  ✓ Collision damage (single or multi-vehicle accidents)
  ✓ Theft of vehicle or vehicle parts
  ✓ Vandalism and malicious damage
  ✓ Fire damage (accidental or arson)
  ✓ Weather-related damage (hail, flood, lightning, falling objects)
  ✓ Coverage capped at P 50,000 per incident

Claim Process:
  - Renter pays: P 1,000 excess + P 150 admin fee
  - Insurance covers: Remaining damage cost up to P 50,000
  - Example: P 25,000 collision = Renter pays P 1,150, Insurance pays P 23,850

Police Report Required For:
  - Theft of vehicle
  - Hit-and-run incidents
  - Vandalism
  - Fire (arson suspected)
  - Accidents involving third parties

Same Exclusions as Basic Coverage

Best For:
  - Highway and long-distance travel
  - High-value vehicles
  - International or first-time renters
  - Peace of mind for comprehensive risks
```

### Package 4: Premium Coverage
```yaml
Name: Premium Coverage
Display Name: "Premium - Maximum Protection"
Premium Percentage: 100% of daily rental amount
Coverage Cap: P 50,000 per incident (same as Standard)
Excess Per Claim: P 500 (REDUCED from P 1,000)
Admin Fee Per Claim: P 150

Formula Example:
  Rental: P 2,000/day × 7 days = P 14,000
  Premium: P 2,000 × 100% × 7 days = P 14,000
  Total: P 28,000

Description: |
  Maximum protection with the lowest excess and priority service.
  Same coverage as Standard but with reduced out-of-pocket cost and enhanced support.

Covers:
  ✓ Everything included in Standard Coverage
  ✓ Same P 50,000 coverage cap

Premium Benefits:
  ✓ REDUCED EXCESS: Only P 500 (vs P 1,000 in Standard)
  ✓ Priority claim processing (24-48 hour turnaround)
  ✓ 24/7 premium support line
  ✓ Extended grace period (up to 4 hours late return with pre-approval)
  ✓ Expedited payout processing
  ✓ Dedicated claims specialist

Claim Process:
  - Renter pays: P 500 excess + P 150 admin fee (Total: P 650)
  - Insurance covers: Remaining damage cost up to P 50,000
  - Example: P 25,000 collision = Renter pays P 650, Insurance pays P 24,350
  - Savings vs Standard: P 500 less out-of-pocket

Same Exclusions as Basic/Standard Coverage

Best For:
  - Luxury vehicle rentals
  - Business travelers needing priority support
  - Renters who want minimum financial exposure
  - Extended trips requiring maximum peace of mind
```

---

## 🗄️ Phase 1: Database Schema & Infrastructure (Days 1-2)

### Story INS-101: Create Insurance Database Tables
**Priority**: P0 - Critical  
**Estimated Time**: 6 hours  
**Assignee**: Backend Engineer

#### Database Migration

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_insurance_tables.sql`

```sql
-- ============================================
-- INSURANCE PACKAGES TABLE (4 tiers)
-- ============================================
CREATE TABLE IF NOT EXISTS public.insurance_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Package identification
  name TEXT NOT NULL UNIQUE CHECK (name IN ('no_coverage', 'basic', 'standard', 'premium')),
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Rental-based pricing formula
  premium_percentage DECIMAL(5,2) NOT NULL CHECK (premium_percentage >= 0 AND premium_percentage <= 1),
  -- 0.00 = 0%, 0.25 = 25%, 0.50 = 50%, 1.00 = 100%
  
  -- Coverage details (Botswana Pula)
  coverage_cap DECIMAL(10,2), -- NULL for no_coverage, 15000 for basic, 50000 for standard/premium
  excess_amount DECIMAL(10,2), -- NULL for no_coverage, 300 for basic, 1000 for standard, 500 for premium
  
  -- Coverage types
  covers_minor_damage BOOLEAN DEFAULT false, -- windscreen, windows, tyres
  covers_major_incidents BOOLEAN DEFAULT false, -- collision, theft, vandalism, fire, weather
  
  -- Terms and conditions
  features TEXT[] NOT NULL, -- List of covered items
  exclusions TEXT[] NOT NULL, -- List of exclusions (common to all paid packages)
  
  -- Admin
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INSURANCE POLICIES TABLE (Active policies for bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_number TEXT UNIQUE NOT NULL, -- Format: INS-YYYY-XXXXXX
  
  -- Relationships
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.insurance_packages(id),
  renter_id UUID NOT NULL REFERENCES auth.users(id),
  car_id UUID NOT NULL REFERENCES public.cars(id),
  
  -- Policy period
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Financial details (Botswana Pula) - Rental-based formula
  rental_amount_per_day DECIMAL(10,2) NOT NULL, -- Base daily rental rate
  premium_per_day DECIMAL(10,2) NOT NULL, -- rental_amount_per_day × premium_percentage
  number_of_days INTEGER NOT NULL CHECK (number_of_days > 0),
  total_premium DECIMAL(10,2) NOT NULL, -- premium_per_day × number_of_days
  
  coverage_cap DECIMAL(10,2), -- Max coverage per incident
  excess_amount DECIMAL(10,2), -- Deductible renter pays per claim
  
  -- Policy status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'claimed')),
  
  -- Terms acceptance
  terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  terms_version TEXT NOT NULL DEFAULT 'v1.0-2025-11', -- Version of T&C accepted
  
  -- Policy documents (generated PDFs)
  policy_document_url TEXT, -- Link to policy PDF in storage
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure dates are logical
  CONSTRAINT valid_policy_dates CHECK (end_date > start_date)
);

-- ============================================
-- INSURANCE CLAIMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number TEXT UNIQUE NOT NULL, -- Format: CLM-YYYY-XXXXXX
  
  -- Relationships
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  renter_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Incident details
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'minor_damage', -- windscreen, windows, tyres
    'collision', 
    'theft', 
    'vandalism', 
    'fire', 
    'weather', -- hail, flood, etc.
    'third_party' -- if covered
  )),
  incident_description TEXT NOT NULL, -- What happened
  damage_description TEXT NOT NULL, -- Description of damage
  location TEXT, -- Where incident occurred
  
  -- Police report (required for theft, hit-and-run, vandalism, fire, third-party)
  police_report_filed BOOLEAN DEFAULT false,
  police_report_number TEXT,
  police_station TEXT,
  
  -- Damage assessment (Botswana Pula)
  estimated_damage_cost DECIMAL(10,2), -- Initial estimate
  actual_damage_cost DECIMAL(10,2), -- Final repair cost
  
  -- Claim status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 
    'under_review', 
    'more_info_needed', 
    'approved', 
    'rejected', 
    'paid', 
    'closed'
  )),
  
  -- Claim resolution (Botswana Pula)
  approved_amount DECIMAL(10,2), -- Amount approved by admin
  excess_paid DECIMAL(10,2), -- Excess/deductible paid by renter
  admin_fee DECIMAL(10,2) DEFAULT 150.00, -- P 150 admin fee per claim
  payout_amount DECIMAL(10,2), -- approved_amount - excess_paid (what insurance pays)
  total_claim_cost DECIMAL(10,2), -- payout_amount + admin_fee (total insurance cost)
  
  rejection_reason TEXT, -- If claim rejected
  
  -- Supporting documents (stored in Supabase Storage: insurance-claims bucket)
  evidence_urls TEXT[], -- Photos of damage
  repair_quotes_urls TEXT[], -- Quotes from repair shops
  repair_invoices_urls TEXT[], -- Final repair invoices (if paid)
  
  -- Workflow timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE, -- When admin first reviewed
  more_info_requested_at TIMESTAMP WITH TIME ZONE, -- If more info needed
  resolved_at TIMESTAMP WITH TIME ZONE, -- When approved/rejected
  paid_at TIMESTAMP WITH TIME ZONE, -- When payout processed
  
  -- Admin handling
  admin_notes TEXT, -- Internal admin notes
  reviewed_by UUID REFERENCES auth.users(id), -- Admin who reviewed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- CLAIM ACTIVITIES TABLE (Timeline/Audit Log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.insurance_claim_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'submitted',
    'reviewed',
    'info_requested',
    'info_provided',
    'approved',
    'rejected',
    'paid',
    'note_added',
    'document_uploaded',
    'status_changed'
  )),
  
  description TEXT NOT NULL, -- Human-readable description
  performed_by UUID REFERENCES auth.users(id), -- User or admin who performed action
  metadata JSONB, -- Additional activity-specific data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_insurance_policies_booking ON public.insurance_policies(booking_id);
CREATE INDEX idx_insurance_policies_renter ON public.insurance_policies(renter_id);
CREATE INDEX idx_insurance_policies_status ON public.insurance_policies(status);
CREATE INDEX idx_insurance_policies_dates ON public.insurance_policies(start_date, end_date);

CREATE INDEX idx_insurance_claims_policy ON public.insurance_claims(policy_id);
CREATE INDEX idx_insurance_claims_booking ON public.insurance_claims(booking_id);
CREATE INDEX idx_insurance_claims_renter ON public.insurance_claims(renter_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX idx_insurance_claims_submitted ON public.insurance_claims(submitted_at);

CREATE INDEX idx_claim_activities_claim ON public.insurance_claim_activities(claim_id);
CREATE INDEX idx_claim_activities_date ON public.insurance_claim_activities(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.insurance_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claim_activities ENABLE ROW LEVEL SECURITY;

-- Insurance Packages: Public read
CREATE POLICY "Insurance packages are viewable by everyone"
  ON public.insurance_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage insurance packages"
  ON public.insurance_packages FOR ALL
  USING (is_admin(auth.uid()));

-- Insurance Policies: Users see their own, hosts see for their cars, admins see all
CREATE POLICY "Users can view their own insurance policies"
  ON public.insurance_policies FOR SELECT
  USING (renter_id = auth.uid());

CREATE POLICY "Car owners can view policies for their cars"
  ON public.insurance_policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = insurance_policies.car_id
      AND cars.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all insurance policies"
  ON public.insurance_policies FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can create insurance policies during booking"
  ON public.insurance_policies FOR INSERT
  WITH CHECK (renter_id = auth.uid());

CREATE POLICY "System can update policy status"
  ON public.insurance_policies FOR UPDATE
  USING (renter_id = auth.uid() OR is_admin(auth.uid()));

-- Insurance Claims: Users see their own, hosts see for their cars, admins manage all
CREATE POLICY "Users can view their own claims"
  ON public.insurance_claims FOR SELECT
  USING (renter_id = auth.uid());

CREATE POLICY "Car owners can view claims for their cars"
  ON public.insurance_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.cars c ON c.id = b.car_id
      WHERE b.id = insurance_claims.booking_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all claims"
  ON public.insurance_claims FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can submit claims for their active policies"
  ON public.insurance_claims FOR INSERT
  WITH CHECK (
    renter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies
      WHERE insurance_policies.id = policy_id
      AND insurance_policies.renter_id = auth.uid()
      AND insurance_policies.status = 'active'
    )
  );

CREATE POLICY "Users can update their own submitted claims"
  ON public.insurance_claims FOR UPDATE
  USING (renter_id = auth.uid() AND status = 'submitted');

CREATE POLICY "Admins can manage all claims"
  ON public.insurance_claims FOR ALL
  USING (is_admin(auth.uid()));

-- Claim Activities: Users see activities for their claims, admins see all
CREATE POLICY "Users can view activities for their claims"
  ON public.insurance_claim_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.insurance_claims
      WHERE insurance_claims.id = claim_id
      AND insurance_claims.renter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all claim activities"
  ON public.insurance_claim_activities FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can create claim activities"
  ON public.insurance_claim_activities FOR INSERT
  WITH CHECK (true); -- Anyone authenticated can log activities

-- ============================================
-- TIMESTAMP UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_insurance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_insurance_packages_updated_at
  BEFORE UPDATE ON public.insurance_packages
  FOR EACH ROW EXECUTE FUNCTION update_insurance_updated_at();

CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION update_insurance_updated_at();

CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW EXECUTE FUNCTION update_insurance_updated_at();

-- ============================================
-- SEED DATA (Based on Actual Botswana Terms)
-- ============================================
INSERT INTO public.insurance_packages (
  name, 
  display_name, 
  description, 
  premium_percentage, 
  coverage_cap, 
  excess_amount, 
  covers_minor_damage, 
  covers_major_incidents, 
  features, 
  exclusions, 
  sort_order
) VALUES
-- Package 1: No Coverage
(
  'no_coverage',
  'No Coverage - Full Liability',
  'You are fully responsible for all damages and losses. Lowest upfront cost but unlimited liability.',
  0.00, -- 0% of rental amount
  NULL, -- No coverage
  NULL, -- No excess
  false,
  false,
  ARRAY[
    'Lowest upfront cost',
    'Suitable for renters with existing insurance',
    'No insurance premium added to rental'
  ],
  ARRAY[
    'UNLIMITED LIABILITY: Full responsibility for ALL damages',
    'Full replacement cost if vehicle stolen or totaled',
    'All repair costs for any damage (minor or major)',
    'All third-party claims',
    'All administrative and legal costs'
  ],
  1
),

-- Package 2: Basic Coverage
(
  'basic',
  'Basic - Minor Damage Protection',
  'Protection for minor damages including windscreen, windows, and tyres. P 15,000 coverage cap.',
  0.25, -- 25% of rental amount
  15000.00, -- P 15,000 coverage cap
  300.00, -- P 300 excess per claim
  true, -- Covers minor damage
  false, -- Does NOT cover major incidents
  ARRAY[
    'Windscreen damage coverage (cracks, chips, breaks)',
    'Front and rear window damage',
    'Tyre damage protection (punctures, blowouts, cuts)',
    'Coverage cap: P 15,000 per incident',
    'P 300 excess per claim',
    'P 150 admin fee per claim',
    'Ideal for city driving'
  ],
  ARRAY[
    'Pre-existing damage not documented at pickup',
    'Rim and wheel damage (tyres covered, not rims)',
    'Damage while driving under influence (DUI)',
    'Unauthorized drivers not on rental agreement',
    'Racing, rallying, or illegal activities',
    'Use outside authorized geographical areas',
    'Normal wear and tear',
    'Mechanical or electrical failures',
    'Improper vehicle use or maintenance neglect',
    'Personal belongings of renter',
    'Key loss or lockout services',
    'Wrong fuel type',
    'Underbody damage from off-road use',
    'DOES NOT COVER: Collision, theft, vandalism, fire, weather damage'
  ],
  2
),

-- Package 3: Standard Coverage
(
  'standard',
  'Standard - Comprehensive Protection',
  'Comprehensive protection for major incidents including collision, theft, vandalism, fire, and weather. P 50,000 coverage cap.',
  0.50, -- 50% of rental amount
  50000.00, -- P 50,000 coverage cap
  1000.00, -- P 1,000 excess per claim
  true, -- Covers minor damage
  true, -- Covers major incidents
  ARRAY[
    'Everything in Basic plus:',
    'Collision damage coverage (single or multi-vehicle)',
    'Theft of vehicle or vehicle parts',
    'Vandalism and malicious damage',
    'Fire damage (accidental or arson)',
    'Weather-related damage (hail, flood, lightning, falling objects)',
    'Coverage cap: P 50,000 per incident',
    'P 1,000 excess per claim',
    'P 150 admin fee per claim',
    'Police report required for theft, hit-and-run, vandalism, fire, third-party accidents'
  ],
  ARRAY[
    'Pre-existing damage not documented at pickup',
    'Rim and wheel damage (tyres covered, not rims)',
    'Damage while driving under influence (DUI)',
    'Unauthorized drivers not on rental agreement',
    'Racing, rallying, or illegal activities',
    'Use outside authorized geographical areas',
    'Normal wear and tear',
    'Mechanical or electrical failures',
    'Improper vehicle use or maintenance neglect',
    'Personal belongings of renter',
    'Key loss or lockout services',
    'Wrong fuel type',
    'Underbody damage from off-road use'
  ],
  3
),

-- Package 4: Premium Coverage
(
  'premium',
  'Premium - Maximum Protection',
  'Maximum protection with reduced excess (P 500) and priority support. Same coverage as Standard with enhanced service.',
  1.00, -- 100% of rental amount
  50000.00, -- P 50,000 coverage cap (same as Standard)
  500.00, -- P 500 excess per claim (REDUCED from P 1,000)
  true,
  true,
  ARRAY[
    'Everything in Standard coverage',
    'REDUCED EXCESS: Only P 500 (vs P 1,000 in Standard)',
    'Priority claim processing (24-48 hours)',
    '24/7 premium support line',
    'Extended grace period (up to 4 hours late return with pre-approval)',
    'Expedited payout processing',
    'Dedicated claims specialist',
    'Coverage cap: P 50,000 per incident',
    'P 150 admin fee per claim'
  ],
  ARRAY[
    'Pre-existing damage not documented at pickup',
    'Rim and wheel damage (tyres covered, not rims)',
    'Damage while driving under influence (DUI)',
    'Unauthorized drivers not on rental agreement',
    'Racing, rallying, or illegal activities',
    'Use outside authorized geographical areas',
    'Normal wear and tear',
    'Mechanical or electrical failures',
    'Improper vehicle use or maintenance neglect',
    'Personal belongings of renter',
    'Key loss or lockout services',
    'Wrong fuel type',
    'Underbody damage from off-road use'
  ],
  4
);

-- ============================================
-- HELPER FUNCTION: Generate Policy Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_policies) + 1;
  new_number := 'INS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Generate Claim Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM public.insurance_claims) + 1;
  new_number := 'CLM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

---

## 💾 Phase 2: Storage & Service Layer (Days 2-3)

### Story INS-102: Setup Storage Buckets
**Priority**: P0  
**Estimated Time**: 1 hour

```sql
-- Create storage buckets for insurance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
(
  'insurance-policies',
  'insurance-policies',
  false, -- Private
  5242880, -- 5MB max
  ARRAY['application/pdf']
),
(
  'insurance-claims',
  'insurance-claims',
  false, -- Private
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
);

-- RLS Policies for insurance-policies bucket
CREATE POLICY "Users can view their own policy documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'insurance-policies'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "System can upload policy documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'insurance-policies'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for insurance-claims bucket
CREATE POLICY "Users can view their own claim evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'insurance-claims'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload claim evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'insurance-claims'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can access all insurance documents"
  ON storage.objects FOR ALL
  USING (
    (bucket_id = 'insurance-policies' OR bucket_id = 'insurance-claims')
    AND is_admin(auth.uid())
  );
```

### Story INS-103: Insurance Service Layer
**Priority**: P0  
**Estimated Time**: 6 hours

**File**: `src/services/insuranceService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type InsurancePackage = Database['public']['Tables']['insurance_packages']['Row'];
export type InsurancePolicy = Database['public']['Tables']['insurance_policies']['Row'];
export type InsuranceClaim = Database['public']['Tables']['insurance_claims']['Row'];

/**
 * Premium calculation result using rental-amount-based formula
 */
export interface PremiumCalculation {
  packageId: string;
  packageName: string;
  displayName: string;
  description: string;
  
  // Pricing calculation
  dailyRentalAmount: number; // Base car rental per day (e.g., P 500)
  premiumPercentage: number; // 0.00, 0.25, 0.50, 1.00
  premiumPerDay: number; // dailyRentalAmount × premiumPercentage
  numberOfDays: number;
  totalPremium: number; // premiumPerDay × numberOfDays
  
  // Coverage details
  coverageCap: number | null; // P 15,000 or P 50,000
  excessAmount: number | null; // P 300, P 500, or P 1,000
  coversMinorDamage: boolean;
  coversMajorIncidents: boolean;
  
  // T&C
  features: string[];
  exclusions: string[];
}

/**
 * Insurance Service - Handles all insurance-related operations
 * Based on Botswana Mobi_Rides Renters Insurance Terms & Conditions
 */
export class InsuranceService {
  /**
   * Get all active insurance packages
   */
  static async getInsurancePackages(): Promise<InsurancePackage[]> {
    const { data, error } = await supabase
      .from('insurance_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch insurance packages: ${error.message}`);
    return data || [];
  }

  /**
   * Get insurance package by ID
   */
  static async getPackageById(packageId: string): Promise<InsurancePackage> {
    const { data, error } = await supabase
      .from('insurance_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`Failed to fetch insurance package: ${error.message}`);
    return data;
  }

  /**
   * Calculate insurance premium using RENTAL-AMOUNT-BASED formula
   * 
   * Formula: Premium = Daily Rental Rate × Premium Percentage × Number of Days
   * 
   * Examples:
   * 1. Basic Coverage (25%):
   *    - Rental: P 500/day × 7 days = P 3,500
   *    - Premium: P 500 × 0.25 × 7 days = P 875
   *    - Total: P 4,375
   * 
   * 2. Standard Coverage (50%):
   *    - Rental: P 2,000/day × 7 days = P 14,000
   *    - Premium: P 2,000 × 0.50 × 7 days = P 7,000
   *    - Total: P 21,000
   * 
   * 3. Premium Coverage (100%):
   *    - Rental: P 2,000/day × 7 days = P 14,000
   *    - Premium: P 2,000 × 1.00 × 7 days = P 14,000
   *    - Total: P 28,000
   */
  static async calculatePremium(
    packageId: string,
    dailyRentalAmount: number,
    startDate: Date,
    endDate: Date
  ): Promise<PremiumCalculation> {
    const insurancePackage = await this.getPackageById(packageId);
    
    // Calculate number of rental days (minimum 1 day)
    const numberOfDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Apply rental-based formula
    const premiumPerDay = dailyRentalAmount * insurancePackage.premium_percentage;
    const totalPremium = premiumPerDay * numberOfDays;

    return {
      packageId: insurancePackage.id,
      packageName: insurancePackage.name,
      displayName: insurancePackage.display_name,
      description: insurancePackage.description,
      
      dailyRentalAmount,
      premiumPercentage: insurancePackage.premium_percentage,
      premiumPerDay: Math.round(premiumPerDay * 100) / 100, // Round to 2 decimals
      numberOfDays,
      totalPremium: Math.round(totalPremium * 100) / 100,
      
      coverageCap: insurancePackage.coverage_cap,
      excessAmount: insurancePackage.excess_amount,
      coversMinorDamage: insurancePackage.covers_minor_damage,
      coversMajorIncidents: insurancePackage.covers_major_incidents,
      
      features: insurancePackage.features || [],
      exclusions: insurancePackage.exclusions || [],
    };
  }

  /**
   * Calculate premiums for all packages (for comparison display)
   */
  static async calculateAllPremiums(
    dailyRentalAmount: number,
    startDate: Date,
    endDate: Date
  ): Promise<PremiumCalculation[]> {
    const packages = await this.getInsurancePackages();
    
    const calculations = await Promise.all(
      packages.map(pkg => 
        this.calculatePremium(pkg.id, dailyRentalAmount, startDate, endDate)
      )
    );

    return calculations;
  }

  /**
   * Create insurance policy when booking is confirmed
   */
  static async createPolicy(
    bookingId: string,
    packageId: string,
    renterId: string,
    carId: string,
    startDate: Date,
    endDate: Date,
    dailyRentalAmount: number,
    termsVersion: string = 'v1.0-2025-11'
  ): Promise<InsurancePolicy> {
    const calculation = await this.calculatePremium(
      packageId, 
      dailyRentalAmount, 
      startDate, 
      endDate
    );

    // Generate policy number (will be done by DB function, but we can call it here)
    const policyNumber = await this.generatePolicyNumber();

    const policyData = {
      policy_number: policyNumber,
      booking_id: bookingId,
      package_id: packageId,
      renter_id: renterId,
      car_id: carId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      rental_amount_per_day: dailyRentalAmount,
      premium_per_day: calculation.premiumPerDay,
      number_of_days: calculation.numberOfDays,
      total_premium: calculation.totalPremium,
      coverage_cap: calculation.coverageCap,
      excess_amount: calculation.excessAmount,
      status: 'active',
      terms_accepted_at: new Date().toISOString(),
      terms_version: termsVersion,
    };

    const { data, error } = await supabase
      .from('insurance_policies')
      .insert(policyData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create insurance policy: ${error.message}`);
    
    // TODO: Generate policy PDF document and upload to storage
    // await this.generatePolicyDocument(data.id);
    
    return data;
  }

  /**
   * Generate unique policy number
   * Format: INS-YYYY-XXXXXX (e.g., INS-2025-000123)
   */
  private static async generatePolicyNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_policy_number');
    
    if (error) {
      // Fallback if function doesn't exist yet
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `INS-${year}-${random}`;
    }
    
    return data;
  }

  /**
   * Get policy by booking ID
   */
  static async getPolicyByBookingId(bookingId: string): Promise<InsurancePolicy | null> {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select(`
        *,
        package:insurance_packages(*),
        booking:bookings(*),
        car:cars(*)
      `)
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all policies for a renter
   */
  static async getPoliciesByRenterId(renterId: string): Promise<InsurancePolicy[]> {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select(`
        *,
        package:insurance_packages(*),
        booking:bookings(*),
        car:cars(*)
      `)
      .eq('renter_id', renterId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch policies: ${error.message}`);
    return data || [];
  }

  /**
   * Update policy status (e.g., expire policy when booking ends)
   */
  static async updatePolicyStatus(
    policyId: string, 
    status: 'active' | 'expired' | 'cancelled' | 'claimed'
  ): Promise<void> {
    const { error } = await supabase
      .from('insurance_policies')
      .update({ status })
      .eq('id', policyId);

    if (error) throw new Error(`Failed to update policy status: ${error.message}`);
  }

  /**
   * Check if policy is currently valid
   */
  static isPolicyValid(policy: InsurancePolicy, checkDate: Date = new Date()): boolean {
    const startDate = new Date(policy.start_date);
    const endDate = new Date(policy.end_date);
    
    return (
      policy.status === 'active' && 
      checkDate >= startDate && 
      checkDate <= endDate
    );
  }

  /**
   * Calculate claim payout
   * Formula: Payout = MIN(Damage Cost, Coverage Cap) - Excess
   * Total Claim Cost = Payout + Admin Fee (P 150)
   */
  static calculateClaimPayout(
    damageCost: number,
    coverageCap: number,
    excess: number,
    adminFee: number = 150
  ): {
    approvedAmount: number;
    excessPaid: number;
    payoutAmount: number;
    adminFee: number;
    totalClaimCost: number;
    renterPays: number;
  } {
    // Approved amount is capped at coverage limit
    const approvedAmount = Math.min(damageCost, coverageCap);
    
    // Renter pays excess (deductible) + admin fee
    const excessPaid = excess;
    const renterPays = excessPaid + adminFee;
    
    // Insurance pays the rest (up to coverage cap)
    const payoutAmount = Math.max(0, approvedAmount - excessPaid);
    
    // Total cost to insurance (payout + admin fee)
    const totalClaimCost = payoutAmount + adminFee;

    return {
      approvedAmount,
      excessPaid,
      payoutAmount,
      adminFee,
      totalClaimCost,
      renterPays,
    };
  }
}

export default InsuranceService;
```

---

## 🎨 Phase 3: UI Components (Days 4-7)

### Story INS-104: Insurance Package Selector Component
**Priority**: P1  
**Estimated Time**: 8 hours

**File**: `src/components/insurance/InsurancePackageSelector.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Shield, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { InsuranceService, PremiumCalculation } from '@/services/insuranceService';
import { cn } from '@/lib/utils';

interface InsurancePackageSelectorProps {
  dailyRentalAmount: number;
  startDate: Date;
  endDate: Date;
  selectedPackageId?: string;
  onPackageSelect: (packageId: string, totalPremium: number) => void;
  className?: string;
}

export const InsurancePackageSelector: React.FC<InsurancePackageSelectorProps> = ({
  dailyRentalAmount,
  startDate,
  endDate,
  selectedPackageId,
  onPackageSelect,
  className,
}) => {
  const [calculations, setCalculations] = useState<PremiumCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsuranceOptions();
  }, [dailyRentalAmount, startDate, endDate]);

  const loadInsuranceOptions = async () => {
    try {
      setLoading(true);
      const premiums = await InsuranceService.calculateAllPremiums(
        dailyRentalAmount,
        startDate,
        endDate
      );
      setCalculations(premiums);
      setError(null);
    } catch (err) {
      setError('Failed to load insurance options. Please try again.');
      console.error('Insurance loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `P ${amount.toFixed(2)}`;
  };

  const getPackageIcon = (packageName: string) => {
    if (packageName === 'no_coverage') {
      return <AlertTriangle className="h-6 w-6 text-destructive" />;
    }
    return <Shield className="h-6 w-6 text-primary" />;
  };

  const getPackageBadgeColor = (packageName: string) => {
    switch(packageName) {
      case 'no_coverage': return 'destructive';
      case 'basic': return 'secondary';
      case 'standard': return 'default';
      case 'premium': return 'default';
      default: return 'secondary';
    }
  };

  const getPackageGradient = (packageName: string) => {
    switch(packageName) {
      case 'no_coverage': return 'from-orange-50 to-red-50';
      case 'basic': return 'from-blue-50 to-cyan-50';
      case 'standard': return 'from-purple-50 to-pink-50';
      case 'premium': return 'from-amber-50 to-yellow-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Choose your protection level.</strong> All prices are based on{' '}
          {formatCurrency(dailyRentalAmount)}/day for {calculations[0]?.numberOfDays || 0} days.
          Claims require a P 150 admin fee.
        </AlertDescription>
      </Alert>

      {/* Insurance Packages */}
      <div className="grid gap-4 md:grid-cols-2">
        {calculations.map((calc) => (
          <Card
            key={calc.packageId}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              'bg-gradient-to-br',
              getPackageGradient(calc.packageName),
              selectedPackageId === calc.packageId && 'ring-2 ring-primary shadow-xl'
            )}
            onClick={() => onPackageSelect(calc.packageId, calc.totalPremium)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getPackageIcon(calc.packageName)}
                  <div>
                    <CardTitle className="text-xl">
                      {calc.displayName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {calc.premiumPercentage === 0 
                        ? 'No insurance coverage'
                        : `${(calc.premiumPercentage * 100).toFixed(0)}% of rental amount`
                      }
                    </CardDescription>
                  </div>
                </div>
                
                {selectedPackageId === calc.packageId && (
                  <Badge variant={getPackageBadgeColor(calc.packageName)} className="gap-1">
                    <Check className="h-3 w-3" /> Selected
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {calc.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing Display */}
              <div className="bg-background/80 backdrop-blur p-4 rounded-lg">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {formatCurrency(calc.totalPremium)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(calc.premiumPerDay)}/day × {calc.numberOfDays} days
                    </div>
                  </div>
                  
                  {calc.coverageCap && (
                    <div className="text-right">
                      <div className="text-sm font-semibold">Coverage</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(calc.coverageCap)}
                      </div>
                    </div>
                  )}
                </div>

                {calc.excessAmount !== null && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Excess per claim:</span>
                    <span className="font-medium">{formatCurrency(calc.excessAmount)}</span>
                  </div>
                )}
              </div>

              {/* Coverage Summary */}
              <div className="space-y-2">
                {calc.coversMinorDamage && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Minor damage (windscreen, windows, tyres)</span>
                  </div>
                )}
                {calc.coversMajorIncidents && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Major incidents (collision, theft, vandalism, fire)</span>
                  </div>
                )}
                {!calc.coversMinorDamage && !calc.coversMajorIncidents && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">No coverage - Full liability</span>
                  </div>
                )}
              </div>

              {/* Expandable Details */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="text-sm hover:no-underline py-2">
                    View full coverage details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {/* Features */}
                    {calc.features.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-2 text-green-700">
                          What's Covered
                        </h4>
                        <ul className="space-y-1">
                          {calc.features.map((feature, idx) => (
                            <li key={idx} className="text-xs flex gap-2">
                              <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exclusions */}
                    {calc.exclusions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-2 text-destructive">
                          What's NOT Covered
                        </h4>
                        <ul className="space-y-1">
                          {calc.exclusions.slice(0, 5).map((exclusion, idx) => (
                            <li key={idx} className="text-xs flex gap-2">
                              <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{exclusion}</span>
                            </li>
                          ))}
                          {calc.exclusions.length > 5 && (
                            <li className="text-xs text-muted-foreground italic">
                              ...and {calc.exclusions.length - 5} more exclusions
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>

            <CardFooter>
              <Button
                variant={selectedPackageId === calc.packageId ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onPackageSelect(calc.packageId, calc.totalPremium);
                }}
              >
                {selectedPackageId === calc.packageId ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Selected
                  </>
                ) : (
                  'Select This Coverage'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs space-y-1">
          <p>
            <strong>Important:</strong> Insurance coverage begins at vehicle pickup and ends at drop-off.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Late returns covered for up to 2 hours with pre-approval (Premium only)</li>
            <li>All claims require P 150 administrative fee</li>
            <li>Police report required for theft, vandalism, fire, and third-party accidents</li>
            <li>Pre-existing damage must be documented during pickup inspection</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InsurancePackageSelector;
```

### Story INS-105: Integrate Insurance into Booking Flow
**Priority**: P1  
**Estimated Time**: 6 hours

**Key Integration Points:**
1. Add insurance step to `BookingDialog` component
2. Update booking total calculation to include insurance premium
3. Create insurance policy after booking confirmation
4. Display insurance details in booking confirmation

**Modified**: `src/components/booking/BookingDialog.tsx` (Pseudo-code)

```typescript
// Add insurance state
const [selectedInsurancePackageId, setSelectedInsurancePackageId] = useState<string>('');
const [insurancePremium, setInsurancePremium] = useState<number>(0);

// Update total calculation
const rentalTotal = calculateBookingTotal(startDate, endDate, car.price_per_day);
const totalWithInsurance = rentalTotal + insurancePremium;

// Add insurance selection step
{bookingStep === 'insurance' && (
  <InsurancePackageSelector
    dailyRentalAmount={car.price_per_day}
    startDate={startDate}
    endDate={endDate}
    selectedPackageId={selectedInsurancePackageId}
    onPackageSelect={(packageId, premium) => {
      setSelectedInsurancePackageId(packageId);
      setInsurancePremium(premium);
      setBookingStep('confirmation');
    }}
  />
)}

// After booking confirmation, create insurance policy
const handleConfirmBooking = async () => {
  try {
    // 1. Create booking
    const bookingResult = await createBooking({...});
    
    // 2. Create insurance policy if selected (skip if no_coverage)
    if (selectedInsurancePackageId) {
      const insurancePackage = await InsuranceService.getPackageById(selectedInsurancePackageId);
      
      // Only create policy if not "no_coverage"
      if (insurancePackage.name !== 'no_coverage') {
        await InsuranceService.createPolicy(
          bookingResult.id,
          selectedInsurancePackageId,
          user.id,
          car.id,
          startDate,
          endDate,
          car.price_per_day
        );
      }
    }
    
    // 3. Process payment (rental + insurance)
    await processPayment(totalWithInsurance);
    
    // 4. Show success
    toast.success('Booking confirmed with insurance coverage!');
  } catch (error) {
    console.error('Booking error:', error);
    toast.error('Failed to complete booking');
  }
};
```

### Story INS-106: Insurance Policy Display Component
**Priority**: P2  
**Estimated Time**: 4 hours

Show user's active insurance policies on bookings page with policy details and download option.

---

## 🛠️ Phase 4: Claims Management (Days 8-10)

### Story INS-107: Claims Submission Form
**Priority**: P1  
**Estimated Time**: 8 hours

User-facing form for submitting insurance claims with:
- Incident date/time selection
- Incident type dropdown (matching package coverage)
- Damage description textarea
- Photo upload (max 5 images, 10MB each)
- Police report details (if applicable)
- Damage cost estimate

### Story INS-108: Admin Claims Management Dashboard
**Priority**: P1  
**Estimated Time**: 10 hours

Admin interface for managing claims:
- Claims list with filtering (status, date, package type)
- Claim detail view with all evidence
- Approve/reject claim action
- Payout calculation display
- Admin notes and internal communication
- Claims timeline/activity log

---

## 🧪 Phase 5: Testing & Documentation (Days 11-12)

### Story INS-109: Comprehensive Testing
**Priority**: P1  
**Estimated Time**: 8 hours

- **Unit Tests**: InsuranceService methods, premium calculations
- **Integration Tests**: Booking + insurance flow, claim submission
- **E2E Tests**: Complete booking with insurance, claim lifecycle
- **Security Tests**: RLS policies, unauthorized access attempts
- **Performance Tests**: Large-scale policy/claim queries

### Story INS-110: Documentation & Training
**Priority**: P2  
**Estimated Time**: 4 hours

- User guide: How to select insurance, file claims
- Admin guide: Claims review process, payout procedures
- API documentation: Insurance service methods
- Knowledge base update: Add insurance section
- Support team training materials

---

## 📊 Success Metrics & KPIs

### Business Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Insurance Attach Rate** | 30%+ | % of bookings with paid insurance |
| **Average Premium** | P 300-600 | Average premium per booking |
| **Revenue from Insurance** | P 20,000+/month | Total premium revenue |
| **Claim Rate** | <10% | % of policies with claims |
| **Claim Approval Rate** | >85% | % of claims approved |
| **Average Payout** | P 3,000-8,000 | Average approved claim payout |

### Technical Metrics
| Metric | Target |
|--------|--------|
| **API Response Time** | <300ms for package lookup |
| **Policy Creation Time** | <1 second |
| **Claim Submission Success Rate** | >99% |
| **Zero Insurance-Related Booking Failures** | 100% |

### User Experience Metrics
| Metric | Target |
|--------|--------|
| **Insurance Selection Completion Rate** | >95% |
| **Claim Form Abandonment Rate** | <15% |
| **User Satisfaction with Insurance Feature** | 4.5+/5 |
| **Claim Resolution Time** | <48 hours (average) |

---

## 🚨 Risks & Mitigation Strategies

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Legal/Regulatory Issues** | High | Low | Partner with licensed insurance provider, legal review |
| **High Claim Rate** | High | Medium | Clear exclusions, thorough vehicle inspection process |
| **Fraudulent Claims** | Medium | Medium | Photo evidence requirements, admin review process |
| **Low Attach Rate** | Medium | Medium | A/B test pricing, highlight value proposition |
| **Complex Premium Calculation Bugs** | Medium | Low | Extensive unit tests, formula validation |
| **Database Performance** | Low | Low | Proper indexing, query optimization |

---

## 📅 Implementation Timeline (Gantt Chart)

```
Week 1 (Days 1-5):
├── Day 1-2: Database Schema & Storage ████████ [INS-101, INS-102]
├── Day 2-3: Service Layer Development ████████ [INS-103]
└── Day 4-5: UI Component (Package Selector) ██████████ [INS-104]

Week 2 (Days 6-10):
├── Day 6-7: Booking Integration ████████ [INS-105]
├── Day 7-8: Policy Display Component ██████ [INS-106]
├── Day 8-9: Claims Submission Form ████████ [INS-107]
└── Day 10: Claims Admin Dashboard (Start) ████ [INS-108]

Week 3 (Days 11-12):
├── Day 11: Claims Admin Dashboard (Complete) ██████ [INS-108]
├── Day 11: Testing ████████ [INS-109]
└── Day 12: Documentation & Launch Prep ████ [INS-110]
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All database migrations tested in staging
- [ ] RLS policies verified for all user roles
- [ ] Insurance packages seeded with correct Botswana terms
- [ ] Storage buckets created with proper permissions
- [ ] Service layer unit tests passing (>90% coverage)
- [ ] UI components tested across devices
- [ ] Booking flow integration tested end-to-end
- [ ] Admin dashboard access verified
- [ ] Legal review of insurance terms completed
- [ ] Support team trained on claims handling

### Deployment
- [ ] Run database migrations in production
- [ ] Deploy updated frontend code
- [ ] Verify insurance packages visible to users
- [ ] Test booking with insurance (use test card)
- [ ] Verify policy creation in database
- [ ] Test claim submission flow
- [ ] Monitor error logs for 24 hours
- [ ] Set up analytics tracking for insurance metrics

### Post-Deployment
- [ ] Announce insurance feature to users (email, in-app)
- [ ] Monitor insurance attach rate daily (Week 1)
- [ ] Track first claims submissions
- [ ] Gather user feedback on insurance selection UX
- [ ] Review admin claims processing workflow
- [ ] Optimize based on initial data (Week 2-4)

---

## 📖 Appendices

### Appendix A: Premium Calculation Examples

#### Example 1: Budget Rental with Basic Coverage
```
Vehicle: Toyota Vitz (Economy)
Daily Rental Rate: P 350/day
Rental Period: 5 days
Selected Insurance: Basic (25%)

Calculations:
--------------
Rental Cost: P 350 × 5 days = P 1,750
Insurance Premium: P 350 × 0.25 × 5 days = P 437.50
--------------------------------------------------
TOTAL: P 2,187.50

Coverage Details:
- Coverage Cap: P 15,000
- Excess Per Claim: P 300
- Admin Fee: P 150
- Covers: Windscreen, windows, tyres only
```

#### Example 2: Luxury Rental with Premium Coverage
```
Vehicle: Mercedes-Benz C-Class (Luxury)
Daily Rental Rate: P 2,500/day
Rental Period: 7 days
Selected Insurance: Premium (100%)

Calculations:
--------------
Rental Cost: P 2,500 × 7 days = P 17,500
Insurance Premium: P 2,500 × 1.00 × 7 days = P 17,500
--------------------------------------------------
TOTAL: P 35,000

Coverage Details:
- Coverage Cap: P 50,000
- Excess Per Claim: P 500 (lowest!)
- Admin Fee: P 150
- Covers: Everything (minor + major incidents)
- Benefits: Priority support, expedited claims
```

#### Example 3: Claim Payout Calculation
```
Scenario: Windscreen crack on Standard Coverage

Damage Cost: P 3,500 (windscreen replacement)
Coverage: Standard (P 50,000 cap, P 1,000 excess)

Payout Calculation:
-------------------
Damage Cost: P 3,500
Coverage Cap: P 50,000 (damage is within cap)
Approved Amount: P 3,500

Renter Pays:
- Excess: P 1,000
- Admin Fee: P 150
- TOTAL RENTER PAYS: P 1,150

Insurance Pays:
- Payout: P 3,500 - P 1,000 excess = P 2,500
- Admin Fee (internal): P 150
- TOTAL INSURANCE COST: P 2,650
```

### Appendix B: Comparison with Original Plan

| Aspect | October Plan | November Plan (Current) |
|--------|--------------|-------------------------|
| **Premium Calculation** | Vehicle value × risk factor | Rental amount × percentage |
| **Package Pricing** | Fixed daily rates (P 35, P 60, P 95) | Percentage-based (0%, 25%, 50%, 100%) |
| **Number of Packages** | 3 (Basic, Standard, Premium) | 4 (No Coverage, Basic, Standard, Premium) |
| **Coverage Caps** | P 50k, P 100k, P 200k | P 0, P 15k, P 50k, P 50k |
| **Excess Amounts** | P 2k, P 1k, P 0 | P 0, P 300, P 1k, P 500 |
| **Admin Fee** | Not specified | P 150 per claim |
| **Terms Source** | Generic industry | Actual Botswana policy document |
| **Implementation Time** | 22 days | 12 days |
| **Maintenance Overhead** | High (vehicle values) | Low (automatic scaling) |

### Appendix C: Legal & Compliance Notes

**Important**: This implementation is based on the **Mobi_Rides Renters Terms and Conditions (Botswana)** document provided. Before production deployment:

1. **Legal Review**: Have a qualified insurance lawyer review all terms, exclusions, and disclaimers
2. **Regulatory Compliance**: Ensure compliance with Botswana insurance regulations (NBFIRA)
3. **Licensing**: Verify if platform needs insurance broker/agent license
4. **Partner Insurance Provider**: Consider partnering with licensed insurance company for underwriting
5. **Terms & Conditions**: Display full T&C with checkbox acceptance before insurance purchase
6. **Privacy**: Ensure claims data handling complies with data protection laws
7. **Dispute Resolution**: Define clear claims dispute and appeals process

### Appendix D: Future Enhancements (Post-Launch)

**Phase 6: Advanced Features (Month 2-3)**
- [ ] Third-party insurance provider API integration
- [ ] Automated claims processing (AI/ML for fraud detection)
- [ ] PDF policy document generation
- [ ] Email notifications for policy creation and claims
- [ ] SMS notifications for claim status updates
- [ ] Insurance analytics dashboard for admins
- [ ] Dynamic pricing based on vehicle risk profiles
- [ ] Seasonal insurance promotions
- [ ] Insurance add-ons (roadside assistance, personal accident)
- [ ] Multi-language support for insurance terms

---

## 📞 Support & Contact

For questions or clarifications during implementation:
- **Technical Lead**: [Name]
- **Product Owner**: [Name]
- **Legal/Compliance**: [Name]
- **Project Slack Channel**: `#insurance-integration`

---

**Document Version**: 2.0  
**Last Updated**: November 12, 2025  
**Next Review**: Post-implementation (Week of December 2, 2025)
