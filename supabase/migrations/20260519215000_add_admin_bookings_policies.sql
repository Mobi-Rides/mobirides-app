-- Migration: Add Admin RLS Policies for Bookings Table
-- Description: Allows Admin and SuperAdmin roles to view and update all bookings on the platform.

-- 1. Enable RLS on bookings table (should already be enabled, but good practice to ensure)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing admin policies if they exist (defensive cleanup)
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

-- 3. Create SELECT policy for Admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
USING (public.is_admin(auth.uid()));

-- 4. Create UPDATE policy for Admins to update all bookings (e.g. confirming, cancelling)
CREATE POLICY "Admins can update all bookings"
ON public.bookings FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
