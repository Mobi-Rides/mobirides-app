-- Seed FIRST100 Campaign Code
INSERT INTO public.promo_codes (
  code, 
  discount_amount, 
  discount_type, 
  max_uses, 
  description,
  terms_conditions,
  valid_until
) VALUES (
  'FIRST100', 
  100, 
  'fixed', 
  500, 
  'First 500 renters get P100 off their first booking!',
  'Valid for first-time bookings only. Cannot be combined with other offers. One use per user.',
  '2025-12-31 23:59:59+00'
)
ON CONFLICT (code) DO NOTHING;
