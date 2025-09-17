-- Fix reviews SELECT policy to allow public viewing of car reviews
-- The current policy is too restrictive and prevents users from seeing reviews from other users

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view reviews for their bookings" ON public.reviews;

-- Create a new policy that allows public viewing of published car reviews
CREATE POLICY "Public can view published car reviews" ON public.reviews
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow viewing of published reviews
    status = 'published'
    AND
    -- Only for car reviews (not personal reviews between users)
    review_type = 'car'
  );

-- Create a separate policy for users to view their own reviews and reviews for their bookings
CREATE POLICY "Users can view their own reviews and booking reviews" ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Allow users to view reviews they created
      reviews.reviewer_id = auth.uid()
      OR
      -- Allow users to view reviews they received
      reviews.reviewee_id = auth.uid()
      OR
      -- Allow users to view reviews for bookings they're involved in
      (
        -- Check if user is the renter of the booking
        EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = reviews.booking_id
          AND b.renter_id = auth.uid()
        )
        OR
        -- Check if user is the host of the booking (through car ownership)
        EXISTS (
          SELECT 1 FROM public.bookings b
          JOIN public.cars c ON b.car_id = c.id
          WHERE b.id = reviews.booking_id
          AND c.owner_id = auth.uid()
        )
      )
    )
  );