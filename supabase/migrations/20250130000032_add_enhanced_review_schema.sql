-- Phase 1: Enhanced Review System Database Schema
-- Add missing columns to support enhanced review functionality

-- Add new columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS review_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category_ratings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS response TEXT,
ADD COLUMN IF NOT EXISTS response_at TIMESTAMP WITH TIME ZONE;

-- Update review_type enum to support bidirectional reviews
ALTER TYPE review_type ADD VALUE IF NOT EXISTS 'host_to_renter';
ALTER TYPE review_type ADD VALUE IF NOT EXISTS 'renter_to_host';
ALTER TYPE review_type ADD VALUE IF NOT EXISTS 'car';

-- Enhanced calculate_car_rating function with category support
CREATE OR REPLACE FUNCTION public.calculate_car_rating(car_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
        FROM reviews
        WHERE car_id = car_uuid
        AND review_type = 'car'
        AND status = 'published'
    );
END;
$function$;

-- Enhanced calculate_user_rating function with bidirectional support
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
        FROM reviews
        WHERE reviewee_id = user_uuid
        AND review_type IN ('renter', 'host_to_renter', 'renter_to_host')
        AND status = 'published'
    );
END;
$function$;

-- New function: Calculate category-specific ratings
CREATE OR REPLACE FUNCTION public.calculate_category_ratings(car_uuid uuid)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB := '{}';
    category_keys TEXT[] := ARRAY['cleanliness', 'punctuality', 'responsiveness', 'car_condition', 'rental_experience'];
    category_key TEXT;
    avg_rating NUMERIC;
BEGIN
    -- Calculate overall average first
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO avg_rating
    FROM reviews
    WHERE car_id = car_uuid AND review_type = 'car' AND status = 'published';
    
    result := jsonb_build_object('overall', avg_rating);
    
    -- Calculate category-specific averages
    FOREACH category_key IN ARRAY category_keys
    LOOP
        SELECT COALESCE(AVG((category_ratings->>category_key)::NUMERIC), 0) INTO avg_rating
        FROM reviews
        WHERE car_id = car_uuid 
        AND review_type = 'car' 
        AND status = 'published'
        AND category_ratings ? category_key;
        
        result := result || jsonb_build_object(category_key, avg_rating);
    END LOOP;
    
    RETURN result;
END;
$function$;

-- New function: Get comprehensive user review statistics
CREATE OR REPLACE FUNCTION public.get_user_review_stats(user_uuid uuid)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB := '{}';
    host_rating NUMERIC;
    renter_rating NUMERIC;
    total_reviews INTEGER;
BEGIN
    -- Calculate host rating (when user is being reviewed as a host)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO host_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'renter_to_host'
    AND status = 'published';
    
    -- Calculate renter rating (when user is being reviewed as a renter)
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) INTO renter_rating
    FROM reviews
    WHERE reviewee_id = user_uuid 
    AND review_type = 'host_to_renter'
    AND status = 'published';
    
    -- Count total reviews received
    SELECT COUNT(*) INTO total_reviews
    FROM reviews
    WHERE reviewee_id = user_uuid
    AND review_type IN ('host_to_renter', 'renter_to_host')
    AND status = 'published';
    
    result := jsonb_build_object(
        'host_rating', host_rating,
        'renter_rating', renter_rating,
        'total_reviews', total_reviews,
        'overall_rating', COALESCE((host_rating + renter_rating) / NULLIF(2, 0), 0)
    );
    
    RETURN result;
END;
$function$;