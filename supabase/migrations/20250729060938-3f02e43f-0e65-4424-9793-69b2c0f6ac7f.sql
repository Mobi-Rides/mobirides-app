-- Check if there's a table with RLS enabled but no policies
-- Let's add RLS policy for locations table which likely has this issue
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for locations table
CREATE POLICY "Users can manage their own location data" 
ON public.locations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);