-- Fix insurance package descriptions and features to align with SLA pricing
-- Fix no_coverage excess_percentage to be NULL so it doesn't show 0% excess in UI
-- Add target_segment for admin use

-- 1. Fix no_coverage
UPDATE public.insurance_packages SET
  excess_percentage = NULL,
  target_segment = 'Budget / risk-tolerant renters'
WHERE name = 'no_coverage';

-- 2. Fix Basic
UPDATE public.insurance_packages SET
  target_segment = 'Short-term city rentals',
  description = 'Protection for minor damages including windscreen, windows, and tyres. P 8,000 coverage cap.',
  features = ARRAY[
    'Windscreen damage coverage (cracks, chips, breaks)',
    'Front and rear window damage',
    'Tyre damage protection (punctures, blowouts, cuts)',
    'Coverage cap: P 8,000 per incident',
    '20% excess per claim',
    'P 150 admin fee per claim',
    'Ideal for city driving'
  ]
WHERE name = 'basic';

-- 3. Fix Standard
UPDATE public.insurance_packages SET
  target_segment = 'Multi-day / intercity trips',
  description = 'Comprehensive protection for major incidents including collision, theft, vandalism, fire, and weather. P 20,000 coverage cap.',
  features = ARRAY[
    'Everything in Basic plus:',
    'Collision damage coverage (single or multi-vehicle)',
    'Theft of vehicle or vehicle parts',
    'Vandalism and malicious damage',
    'Fire damage (accidental or arson)',
    'Weather-related damage (hail, flood, lightning, falling objects)',
    'Coverage cap: P 20,000 per incident',
    '15% excess per claim',
    'P 150 admin fee per claim',
    'Police report required for theft, hit-and-run, vandalism, fire, third-party accidents'
  ]
WHERE name = 'standard';

-- 4. Fix Premium
UPDATE public.insurance_packages SET
  target_segment = 'High-value vehicles / long-term',
  description = 'Maximum protection with reduced excess (10%) and priority support. Same coverage as Standard with enhanced service.',
  features = ARRAY[
    'Everything in Standard coverage',
    'REDUCED EXCESS: Only 10% (vs 15% in Standard)',
    'Priority claim processing (24-48 hours)',
    '24/7 premium support line',
    'Extended grace period (up to 4 hours late return with pre-approval)',
    'Expedited payout processing',
    'Dedicated claims specialist',
    'Coverage cap: P 50,000 per incident',
    'P 150 admin fee per claim'
  ]
WHERE name = 'premium';
