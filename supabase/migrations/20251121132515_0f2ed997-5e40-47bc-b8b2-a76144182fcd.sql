-- Update calculate_car_rating function to return 4.0 as default for cars with no reviews
CREATE OR REPLACE FUNCTION public.calculate_car_rating(car_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this car
    SELECT COUNT(*) INTO review_count
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews
    WHERE car_id = car_uuid
    AND review_type = 'car'
    AND status = 'published';
    
    RETURN avg_rating;
END;
$function$;

-- Update calculate_user_rating function to return 4.0 as default for users with no reviews
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    review_count INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Count reviews for this user (both as host and renter)
    SELECT COUNT(*) INTO review_count
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        -- Traditional reviews
        (r.reviewee_id = user_uuid AND r.review_type IN ('host_to_renter', 'renter_to_host'))
        OR
        -- Car reviews where this user is the car owner (host)
        (c.owner_id = user_uuid AND r.review_type = 'car')
    )
    AND r.status = 'published';
    
    -- If no reviews exist, return 4.0 as default
    IF review_count = 0 THEN
        RETURN 4.0;
    END IF;
    
    -- Calculate average rating
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 4.0) INTO avg_rating
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        r.reviewee_id = user_uuid
        OR c.owner_id = user_uuid
    )
    AND r.review_type IN ('car', 'host_to_renter', 'renter_to_host')
    AND r.status = 'published';
    
    RETURN avg_rating;
END;
$function$;