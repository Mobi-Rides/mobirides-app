-- Create atomic increment function for promo codes
CREATE OR REPLACE FUNCTION increment_promo_code_uses(promo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.promo_codes 
  SET current_uses = current_uses + 1 
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
