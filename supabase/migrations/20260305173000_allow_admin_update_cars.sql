
-- Allow admins to update any car
-- First drop to avoid conflict if it exists with different definition
DROP POLICY IF EXISTS "Admins can update all cars" ON public.cars;

CREATE POLICY "Admins can update all cars" 
ON public.cars 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Allow admins to select any car image (if not already allowed)
DROP POLICY IF EXISTS "Admins can view all car images" ON public.car_images;

CREATE POLICY "Admins can view all car images" 
ON public.car_images 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Ensure is_admin works correctly (re-apply logic just in case, though function should be fine)
-- We don't need to redefine function if it's already there.

-- Grant permissions just in case
GRANT ALL ON public.cars TO authenticated;
GRANT ALL ON public.car_images TO authenticated;
