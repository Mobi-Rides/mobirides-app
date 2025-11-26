-- Migration: Create 7 missing tables that exist in production
-- Tables: car_images, license_verifications, saved_cars, commission_rates, admin_sessions, admin_activity_logs, device_tokens
-- Using DO blocks for idempotent policy creation

-- 1. Create car_images table
CREATE TABLE IF NOT EXISTS public.car_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Car images are viewable by everyone" ON public.car_images FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Car owners can insert their car images" ON public.car_images FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Car owners can update their car images" ON public.car_images FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Car owners can delete their car images" ON public.car_images FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON public.car_images(car_id);
CREATE INDEX IF NOT EXISTS idx_car_images_is_primary ON public.car_images(is_primary) WHERE is_primary = true;
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_image_per_car ON public.car_images(car_id) WHERE is_primary = true;

DO $$ BEGIN
    CREATE TRIGGER update_car_images_updated_at BEFORE UPDATE ON public.car_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Create license_verifications table
CREATE TABLE IF NOT EXISTS public.license_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_number TEXT,
    country_of_issue TEXT,
    date_of_birth DATE,
    expiry_date DATE,
    front_image_path TEXT,
    back_image_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.license_verifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own license verification" ON public.license_verifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own license verification" ON public.license_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own license verification" ON public.license_verifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all license verifications" ON public.license_verifications FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update all license verifications" ON public.license_verifications FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_license_verifications_user_id ON public.license_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_license_verifications_status ON public.license_verifications(status);

DO $$ BEGIN
    CREATE TRIGGER update_license_verifications_updated_at BEFORE UPDATE ON public.license_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Create saved_cars table
CREATE TABLE IF NOT EXISTS public.saved_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, car_id)
);

ALTER TABLE public.saved_cars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own saved cars" ON public.saved_cars FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own saved cars" ON public.saved_cars FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own saved cars" ON public.saved_cars FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_saved_cars_user_id ON public.saved_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cars_car_id ON public.saved_cars(car_id);

DO $$ BEGIN
    CREATE TRIGGER update_saved_cars_updated_at BEFORE UPDATE ON public.saved_cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Create commission_rates table
CREATE TABLE IF NOT EXISTS public.commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate DECIMAL(5,4) DEFAULT 0.15 NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Commission rates are viewable by everyone" ON public.commission_rates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Only admins can insert commission rates" ON public.commission_rates FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Only admins can update commission rates" ON public.commission_rates FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_commission_rates_effective_from ON public.commission_rates(effective_from);

DO $$ BEGIN
    CREATE TRIGGER update_commission_rates_updated_at BEFORE UPDATE ON public.commission_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Create admin_sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view their own sessions" ON public.admin_sessions FOR SELECT USING (auth.uid() = admin_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert their own sessions" ON public.admin_sessions FOR INSERT WITH CHECK (auth.uid() = admin_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update their own sessions" ON public.admin_sessions FOR UPDATE USING (auth.uid() = admin_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Super admins can view all sessions" ON public.admin_sessions FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid() AND admins.is_super_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON public.admin_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- 6. Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view their own activity logs" ON public.admin_activity_logs FOR SELECT USING (auth.uid() = admin_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Super admins can view all activity logs" ON public.admin_activity_logs FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid() AND admins.is_super_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert their own activity logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (auth.uid() = admin_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON public.admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_resource ON public.admin_activity_logs(resource_type, resource_id);

-- 7. Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own device tokens" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own device tokens" ON public.device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own device tokens" ON public.device_tokens FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own device tokens" ON public.device_tokens FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_device_token ON public.device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON public.device_tokens(is_active) WHERE is_active = true;

DO $$ BEGIN
    CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert default commission rate if none exists
INSERT INTO public.commission_rates (rate, effective_from)
SELECT 0.15, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.commission_rates LIMIT 1);