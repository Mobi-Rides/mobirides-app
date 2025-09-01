-- Fix reviews RLS policy to allow public viewing of car reviews
-- The current policy only allows viewing reviews for bookings users are involved in
-- But car detail pages need to show ALL reviews for a car

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view published car reviews" ON public.reviews;

-- Add policy to allow public viewing of published car reviews
CREATE POLICY "Public can view published car reviews" ON public.reviews
  FOR SELECT
  TO public
  USING (
    -- Only show published reviews
    (status IS NULL OR status = 'published')
    AND
    -- Only show car reviews (not user-to-user reviews)
    review_type = 'car'
  );

-- Grant SELECT permission to anon role for reviews table
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.reviews TO authenticated;