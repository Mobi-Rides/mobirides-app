-- Allow admins to insert their car images
DROP POLICY IF EXISTS "Car owners can insert their car images" ON public.car_images;
CREATE POLICY "Car owners or admins can insert their car images" ON public.car_images FOR INSERT WITH CHECK (
    public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
);

-- Allow admins to update their car images
DROP POLICY IF EXISTS "Car owners can update their car images" ON public.car_images;
CREATE POLICY "Car owners or admins can update their car images" ON public.car_images FOR UPDATE USING (
    public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
);

-- Allow admins to delete their car images
DROP POLICY IF EXISTS "Car owners can delete their car images" ON public.car_images;
CREATE POLICY "Car owners or admins can delete their car images" ON public.car_images FOR DELETE USING (
    public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.cars WHERE cars.id = car_images.car_id AND cars.owner_id = auth.uid())
);
