-- Fix get_user_review_stats to include car reviews as host ratings
-- Since car reviews are about the rental experience with the host,
-- they should count towards the host's rating

CREATE OR REPLACE FUNCTION public.get_user_review_stats(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    result JSONB := '{}';
    host_rating NUMERIC;
    renter_rating NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- Calculate host rating (when user is being reviewed as a host)
    -- Include both traditional host reviews AND car reviews where user is the car owner
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO host_rating
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        -- Traditional host reviews
        (r.reviewee_id = user_uuid AND r.review_type = 'renter_to_host')
        OR
        -- Car reviews where this user is the car owner (host)
        (c.owner_id = user_uuid AND r.review_type = 'car')
    )
    AND r.status = 'published';
    
    -- Calculate renter rating (when user is being reviewed as a renter)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO renter_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'host_to_renter'
    AND status = 'published';
    
    -- Count total reviews received (both as host and renter)
    SELECT COUNT(*) INTO total_reviews
    FROM reviews r
    LEFT JOIN cars c ON r.car_id = c.id
    WHERE (
        -- Traditional reviews
        (r.reviewee_id = user_uuid AND r.review_type IN ('host_to_renter', 'renter_to_host'))
        OR
        -- Car reviews where this user is the car owner
        (c.owner_id = user_uuid AND r.review_type = 'car')
    )
    AND r.status = 'published';
    
    result := jsonb_build_object(
        'host_rating', host_rating,
        'renter_rating', renter_rating,
        'total_reviews', total_reviews,
        'overall_rating', CASE 
            WHEN host_rating > 0 AND renter_rating > 0 THEN (host_rating + renter_rating) / 2
            WHEN host_rating > 0 THEN host_rating
            WHEN renter_rating > 0 THEN renter_rating
            ELSE 0
        END
    );
    
    RETURN result;
END;
$function$;

-- Grant necessary permissions
GRANT SELECT ON cars TO anon, authenticated;
GRANT SELECT ON reviews TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_review_stats(uuid) TO anon, authenticated;