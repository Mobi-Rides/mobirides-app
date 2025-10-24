-- Add RLS policies for reviews table to allow authenticated users to submit reviews

-- Allow authenticated users to insert reviews for their bookings
DROP POLICY IF EXISTS "Users can insert reviews for their bookings" ON public.reviews;
CREATE POLICY "Users can insert reviews for their bookings" ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User must be either the renter or host of the booking
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
  );

-- Allow authenticated users to view reviews for bookings they're involved in
DROP POLICY IF EXISTS "Users can view reviews for their bookings" ON public.reviews;
CREATE POLICY "Users can view reviews for their bookings" ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User must be either the renter or host of the booking
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
      OR
      -- Allow users to view reviews they created
      reviews.reviewer_id = auth.uid()
    )
  );

-- Allow authenticated users to update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    -- User must be the reviewer who created the review
    reviews.reviewer_id = auth.uid()
  )
  WITH CHECK (
    -- User must be the reviewer who created the review
    reviews.reviewer_id = auth.uid()
  );

-- Allow authenticated users to delete their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE
  TO authenticated
  USING (
    -- User must be the reviewer who created the review
    reviews.reviewer_id = auth.uid()
  );
