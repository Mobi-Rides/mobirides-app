-- Fix all security search path issues
-- Fix function search paths that were identified as mutable

-- 1. Fix calculate_commission function
CREATE OR REPLACE FUNCTION public.calculate_commission(booking_total numeric, rate numeric DEFAULT 0.1500)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT ROUND(booking_total * rate, 2);
$function$;

-- 2. Fix check_host_wallet_balance function  
CREATE OR REPLACE FUNCTION public.check_host_wallet_balance(host_uuid uuid, required_commission numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current wallet balance
  SELECT balance INTO current_balance 
  FROM public.host_wallets 
  WHERE host_id = host_uuid;
  
  -- Return true if balance is sufficient, false otherwise
  RETURN COALESCE(current_balance, 0) >= required_commission;
END;
$function$;

-- 3. Fix validate_step_dependencies function
CREATE OR REPLACE FUNCTION public.validate_step_dependencies(handover_session_id_param uuid, step_name_param character varying, step_order_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  required_steps_completed BOOLEAN;
BEGIN
  -- Check if all previous steps are completed
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO required_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND step_order < step_order_param;
  
  RETURN required_steps_completed;
END;
$function$;

-- 4. Fix enforce_step_dependencies function
CREATE OR REPLACE FUNCTION public.enforce_step_dependencies()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only check dependencies when marking a step as completed
  IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
    -- Skip dependency check for the first step
    IF NEW.step_order > 1 THEN
      IF NOT public.validate_step_dependencies(NEW.handover_session_id, NEW.step_name, NEW.step_order) THEN
        RAISE EXCEPTION 'Cannot complete step %. Previous steps must be completed first.', NEW.step_name;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. Fix calculate_category_ratings function
CREATE OR REPLACE FUNCTION public.calculate_category_ratings(car_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- 6. Fix calculate_handover_progress function
CREATE OR REPLACE FUNCTION public.calculate_handover_progress(handover_session_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
  current_step INTEGER;
  progress_percentage NUMERIC;
  result JSONB;
BEGIN
  -- Count total steps
  SELECT COUNT(*) INTO total_steps
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param;
  
  -- Count completed steps
  SELECT COUNT(*) INTO completed_steps
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND is_completed = TRUE;
  
  -- Find current step (first incomplete step order)
  SELECT COALESCE(MIN(step_order), total_steps + 1) INTO current_step
  FROM handover_step_completion
  WHERE handover_session_id = handover_session_id_param
  AND is_completed = FALSE;
  
  -- Calculate progress percentage
  progress_percentage := CASE 
    WHEN total_steps = 0 THEN 0
    ELSE ROUND((completed_steps::NUMERIC / total_steps::NUMERIC) * 100, 2)
  END;
  
  result := jsonb_build_object(
    'total_steps', total_steps,
    'completed_steps', completed_steps,
    'current_step', current_step,
    'progress_percentage', progress_percentage,
    'is_completed', completed_steps = total_steps
  );
  
  RETURN result;
END;
$function$;

-- 7. Fix update_handover_session_on_step_completion function
CREATE OR REPLACE FUNCTION public.update_handover_session_on_step_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  all_steps_completed BOOLEAN;
BEGIN
  -- Check if all steps are completed for this handover session
  SELECT COALESCE(bool_and(is_completed), FALSE) INTO all_steps_completed
  FROM handover_step_completion
  WHERE handover_session_id = NEW.handover_session_id;
  
  -- Update handover session completion status if all steps are done
  IF all_steps_completed THEN
    UPDATE handover_sessions
    SET 
      handover_completed = TRUE,
      updated_at = NOW()
    WHERE id = NEW.handover_session_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. Fix get_user_review_stats function
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

-- 9. Fix update_conversation_timestamp function
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$;

-- 10. Fix calculate_car_rating function
CREATE OR REPLACE FUNCTION public.calculate_car_rating(car_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- 11. Fix calculate_user_rating function
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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