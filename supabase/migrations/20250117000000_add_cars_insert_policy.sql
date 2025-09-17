-- Add INSERT RLS policy for cars table to allow users to create their own cars
-- This fixes the car addition failure by enabling authenticated users to insert car records
-- where they are the owner

CREATE POLICY "Users can create their own cars" ON public.cars 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Grant INSERT permission to authenticated role
GRANT INSERT ON public.cars TO authenticated;