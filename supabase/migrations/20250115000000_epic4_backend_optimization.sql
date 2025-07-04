-- Epic 4: Backend Optimization & Security Migration
-- This migration implements comprehensive security and performance improvements

-- 1. RATE LIMITING TABLES AND FUNCTIONS

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    endpoint TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limiting policies
CREATE POLICY "Rate limits are readable by service role only"
ON public.rate_limits
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Rate limits can be inserted by service role only"
ON public.rate_limits
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Rate limits can be updated by service role only"
ON public.rate_limits
FOR UPDATE
USING (auth.role() = 'service_role');

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_ip_address INET,
    p_endpoint TEXT,
    p_user_id UUID DEFAULT NULL,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clean up old entries
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Get current window start
    window_start := date_trunc('minute', NOW() - (EXTRACT(MINUTE FROM NOW()) % p_window_minutes) * INTERVAL '1 minute');
    
    -- Get current count for this IP/endpoint combination
    SELECT COALESCE(SUM(request_count), 0)
    INTO current_count
    FROM public.rate_limits
    WHERE ip_address = p_ip_address 
    AND endpoint = p_endpoint
    AND window_start >= window_start;
    
    -- If user is authenticated, also check user-based limits
    IF p_user_id IS NOT NULL THEN
        SELECT current_count + COALESCE(SUM(request_count), 0)
        INTO current_count
        FROM public.rate_limits
        WHERE user_id = p_user_id 
        AND endpoint = p_endpoint
        AND window_start >= window_start;
    END IF;
    
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update rate limit record
    INSERT INTO public.rate_limits (ip_address, endpoint, user_id, request_count, window_start)
    VALUES (p_ip_address, p_endpoint, p_user_id, 1, window_start)
    ON CONFLICT (ip_address, endpoint, user_id, window_start)
    DO UPDATE SET 
        request_count = public.rate_limits.request_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 2. CAPTCHA VERIFICATION TABLE

-- Create CAPTCHA verification table
CREATE TABLE IF NOT EXISTS public.captcha_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    captcha_token TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for CAPTCHA
CREATE INDEX IF NOT EXISTS idx_captcha_verifications_user_id ON public.captcha_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_captcha_verifications_ip_address ON public.captcha_verifications(ip_address);
CREATE INDEX IF NOT EXISTS idx_captcha_verifications_expires_at ON public.captcha_verifications(expires_at);

-- Enable RLS on captcha_verifications
ALTER TABLE public.captcha_verifications ENABLE ROW LEVEL SECURITY;

-- CAPTCHA policies
CREATE POLICY "Users can read their own CAPTCHA verifications"
ON public.captcha_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CAPTCHA verifications"
ON public.captcha_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CAPTCHA verifications"
ON public.captcha_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to verify CAPTCHA
CREATE OR REPLACE FUNCTION verify_captcha(
    p_user_id UUID,
    p_captcha_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_record RECORD;
BEGIN
    -- Clean up expired verifications
    DELETE FROM public.captcha_verifications 
    WHERE expires_at < NOW();
    
    -- Find the verification record
    SELECT * INTO verification_record
    FROM public.captcha_verifications
    WHERE user_id = p_user_id 
    AND captcha_token = p_captcha_token
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If not found or already verified, return false
    IF verification_record IS NULL OR verification_record.is_verified THEN
        RETURN FALSE;
    END IF;
    
    -- Mark as verified
    UPDATE public.captcha_verifications
    SET is_verified = TRUE, verified_at = NOW()
    WHERE id = verification_record.id;
    
    RETURN TRUE;
END;
$$;

-- 3. FIXED RLS POLICIES FOR CARS TABLE

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Cars are viewable by everyone" ON public.cars;
DROP POLICY IF EXISTS "Users can insert their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can update their own cars" ON public.cars;
DROP POLICY IF EXISTS "Users can delete their own cars" ON public.cars;

-- Create improved RLS policies for cars
CREATE POLICY "Cars are viewable by everyone"
ON public.cars
FOR SELECT
USING (
    -- Allow viewing if car is active and verified
    is_active = true 
    AND is_verified = true
    AND (
        -- Or if user is the owner
        auth.uid() = host_id
        -- Or if user is admin (assuming admin role)
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

CREATE POLICY "Users can insert their own cars"
ON public.cars
FOR INSERT
WITH CHECK (
    auth.uid() = host_id
    AND is_active = false  -- New cars start as inactive
    AND is_verified = false  -- New cars start as unverified
);

CREATE POLICY "Users can update their own cars"
ON public.cars
FOR UPDATE
USING (auth.uid() = host_id)
WITH CHECK (
    auth.uid() = host_id
    AND (
        -- Prevent changing host_id
        host_id = OLD.host_id
        -- Prevent changing verification status unless admin
        OR (is_verified = OLD.is_verified OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    )
);

CREATE POLICY "Users can delete their own cars"
ON public.cars
FOR DELETE
USING (auth.uid() = host_id);

-- 4. FIXED RLS POLICIES FOR BOOKINGS TABLE

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Create improved RLS policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (
    auth.uid() = guest_id 
    OR auth.uid() = host_id
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can insert their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
    auth.uid() = guest_id
    AND status = 'pending'  -- New bookings start as pending
);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (
    auth.uid() = guest_id 
    OR auth.uid() = host_id
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    -- Prevent changing guest_id or host_id
    guest_id = OLD.guest_id
    AND host_id = OLD.host_id
);

CREATE POLICY "Users can delete their own bookings"
ON public.bookings
FOR DELETE
USING (
    auth.uid() = guest_id 
    OR auth.uid() = host_id
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. DATABASE OPTIMIZATION - ADDITIONAL INDEXES

-- Optimize car searches
CREATE INDEX IF NOT EXISTS idx_cars_location_active_verified ON public.cars(latitude, longitude, is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_cars_price_range ON public.cars(price_per_day) WHERE is_active = true AND is_verified = true;
CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON public.cars(brand, model) WHERE is_active = true AND is_verified = true;

-- Optimize booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON public.bookings(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_host ON public.bookings(guest_id, host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car_dates ON public.bookings(car_id, start_date, end_date);

-- Optimize profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 6. PERFORMANCE FUNCTIONS

-- Function to get nearby cars with optimized query
CREATE OR REPLACE FUNCTION get_nearby_cars(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_km NUMERIC DEFAULT 50,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    host_id UUID,
    brand TEXT,
    model TEXT,
    year INTEGER,
    price_per_day NUMERIC,
    latitude NUMERIC,
    longitude NUMERIC,
    distance_km NUMERIC,
    host_name TEXT,
    host_rating NUMERIC,
    images TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.host_id,
        c.brand,
        c.model,
        c.year,
        c.price_per_day,
        c.latitude,
        c.longitude,
        (6371 * acos(cos(radians(p_latitude)) * cos(radians(c.latitude)) * 
         cos(radians(c.longitude) - radians(p_longitude)) + 
         sin(radians(p_latitude)) * sin(radians(c.latitude)))) AS distance_km,
        p.full_name,
        p.rating,
        c.images
    FROM public.cars c
    JOIN public.profiles p ON c.host_id = p.id
    WHERE c.is_active = true 
    AND c.is_verified = true
    AND c.latitude IS NOT NULL 
    AND c.longitude IS NOT NULL
    AND (6371 * acos(cos(radians(p_latitude)) * cos(radians(c.latitude)) * 
         cos(radians(c.longitude) - radians(p_longitude)) + 
         sin(radians(p_latitude)) * sin(radians(c.latitude)))) <= p_radius_km
    ORDER BY distance_km
    LIMIT p_limit;
END;
$$;

-- Function to get user booking statistics
CREATE OR REPLACE FUNCTION get_user_booking_stats(p_user_id UUID)
RETURNS TABLE (
    total_bookings INTEGER,
    completed_bookings INTEGER,
    cancelled_bookings INTEGER,
    total_spent NUMERIC,
    average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_bookings,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as total_spent,
        COALESCE(AVG(rating) FILTER (WHERE rating IS NOT NULL), 0) as average_rating
    FROM public.bookings
    WHERE guest_id = p_user_id;
END;
$$;

-- 7. SECURITY FUNCTIONS

-- Function to validate car ownership
CREATE OR REPLACE FUNCTION validate_car_ownership(p_car_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cars 
        WHERE id = p_car_id AND host_id = auth.uid()
    );
END;
$$;

-- Function to validate booking access
CREATE OR REPLACE FUNCTION validate_booking_access(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = p_booking_id 
        AND (guest_id = auth.uid() OR host_id = auth.uid())
    );
END;
$$;

-- 8. CLEANUP FUNCTIONS

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean up old rate limits (older than 24 hours)
    DELETE FROM public.rate_limits 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up expired CAPTCHA verifications
    DELETE FROM public.captcha_verifications 
    WHERE expires_at < NOW();
    
    -- Clean up old real-time locations (older than 1 day)
    DELETE FROM public.real_time_locations 
    WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- 9. AUDIT LOGGING

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies (only service role can access)
CREATE POLICY "Audit logs are readable by service role only"
ON public.audit_logs
FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Audit logs can be inserted by service role only"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        ip_address,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        inet_client_addr(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_captcha(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_cars(NUMERIC, NUMERIC, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_booking_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_car_ownership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_booking_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) TO service_role; 