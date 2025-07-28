-- Add admin role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Create admin detection function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid AND role = 'admin'
  );
$$;

-- Insert super admin user (maphanyane@mobirides.com)
-- First we need to find or create the user profile
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if user exists in auth.users by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'maphanyane@mobirides.com';
    
    -- If user exists, add to admins table
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admins (id, email, full_name, is_super_admin)
        VALUES (admin_user_id, 'maphanyane@mobirides.com', 'Maphanyane Mobi Rides', true)
        ON CONFLICT (id) DO UPDATE SET
            is_super_admin = true,
            email = 'maphanyane@mobirides.com',
            full_name = 'Maphanyane Mobi Rides',
            updated_at = NOW();
            
        -- Also update profile role
        INSERT INTO public.profiles (id, role, full_name)
        VALUES (admin_user_id, 'admin', 'Maphanyane Mobi Rides')
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            full_name = 'Maphanyane Mobi Rides',
            updated_at = NOW();
    END IF;
END $$;

-- Update RLS policies to include admin access
-- Add admin bypass to cars table
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;
CREATE POLICY "Admins can view all cars" 
ON public.cars FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all cars" ON public.cars;
CREATE POLICY "Admins can update all cars" 
ON public.cars FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to bookings table
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" 
ON public.bookings FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings" 
ON public.bookings FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to wallet transactions
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all wallet transactions" 
ON public.wallet_transactions FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to host wallets
DROP POLICY IF EXISTS "Admins can view all host wallets" ON public.host_wallets;
CREATE POLICY "Admins can view all host wallets" 
ON public.host_wallets FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews" 
ON public.reviews FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
CREATE POLICY "Admins can update all reviews" 
ON public.reviews FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" 
ON public.messages FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Add admin bypass to user verifications
DROP POLICY IF EXISTS "Admins can view all user verifications" ON public.user_verifications;
CREATE POLICY "Admins can view all user verifications" 
ON public.user_verifications FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all user verifications" ON public.user_verifications;
CREATE POLICY "Admins can update all user verifications" 
ON public.user_verifications FOR UPDATE 
USING (public.is_admin(auth.uid()));