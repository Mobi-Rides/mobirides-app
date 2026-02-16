
DROP FUNCTION IF EXISTS public.calculate_category_ratings(uuid);

CREATE OR REPLACE FUNCTION public.calculate_category_ratings(p_car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  car_categories text[] := ARRAY['cleanliness', 'accuracy', 'communication', 'value'];
BEGIN
  FOREACH category_key IN ARRAY car_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE car_id = p_car_id
      AND review_type = 'car'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_renter_category_ratings(p_renter_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  category_key text;
  avg_val numeric;
  renter_categories text[] := ARRAY['punctuality', 'car_care', 'communication'];
BEGIN
  FOREACH category_key IN ARRAY renter_categories
  LOOP
    SELECT AVG((category_ratings->>category_key)::numeric)
    INTO avg_val
    FROM reviews
    WHERE reviewee_id = p_renter_id
      AND review_type = 'host_to_renter'
      AND status = 'published'
      AND category_ratings ? category_key;

    IF avg_val IS NOT NULL THEN
      result := result || jsonb_build_object(category_key, ROUND(avg_val, 1));
    END IF;
  END LOOP;

  RETURN result;
END;
$$;
