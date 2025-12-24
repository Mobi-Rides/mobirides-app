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

-- ============================================
-- STORAGE BUCKETS
-- ============================================
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
) ON CONFLICT (id) DO NOTHING;

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
