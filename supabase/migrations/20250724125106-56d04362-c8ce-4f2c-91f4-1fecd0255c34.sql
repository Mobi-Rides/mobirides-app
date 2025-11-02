-- Drop existing policies and create corrected ones
DROP POLICY IF EXISTS "Users can view their own handover sessions" ON public.handover_sessions;
DROP POLICY IF EXISTS "Users can create handover sessions for their bookings" ON public.handover_sessions;
DROP POLICY IF EXISTS "Users can update their own handover sessions" ON public.handover_sessions;

DROP POLICY IF EXISTS "Users can view handover steps for their sessions" ON public.handover_step_completion;
DROP POLICY IF EXISTS "Users can create handover steps for their sessions" ON public.handover_step_completion;
DROP POLICY IF EXISTS "Users can update handover steps for their sessions" ON public.handover_step_completion;

DROP POLICY IF EXISTS "Users can view identity verification checks for their handover sessions" ON public.identity_verification_checks;
DROP POLICY IF EXISTS "Users can create identity verification checks for their handover sessions" ON public.identity_verification_checks;
DROP POLICY IF EXISTS "Users can update identity verification checks for their handover sessions" ON public.identity_verification_checks;

-- Create corrected RLS policies for handover_sessions table
CREATE POLICY "Users can view their own handover sessions"
ON public.handover_sessions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT renter_id FROM bookings WHERE id = booking_id
    UNION
    SELECT profiles.id FROM profiles
    JOIN cars ON profiles.id = cars.owner_id
    JOIN bookings ON cars.id = bookings.car_id
    WHERE bookings.id = handover_sessions.booking_id
  )
);

CREATE POLICY "Users can create handover sessions for their bookings"
ON public.handover_sessions
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT renter_id FROM bookings WHERE id = booking_id
    UNION
    SELECT profiles.id FROM profiles
    JOIN cars ON profiles.id = cars.owner_id
    JOIN bookings ON cars.id = bookings.car_id
    WHERE bookings.id = handover_sessions.booking_id
  )
);

CREATE POLICY "Users can update their own handover sessions"
ON public.handover_sessions
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT renter_id FROM bookings WHERE id = booking_id
    UNION
    SELECT profiles.id FROM profiles
    JOIN cars ON profiles.id = cars.owner_id
    JOIN bookings ON cars.id = bookings.car_id
    WHERE bookings.id = handover_sessions.booking_id
  )
);

-- Create corrected RLS policies for handover_step_completion table
CREATE POLICY "Users can view handover steps for their sessions"
ON public.handover_step_completion
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = handover_step_completion.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);

CREATE POLICY "Users can create handover steps for their sessions"
ON public.handover_step_completion
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = handover_step_completion.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);

CREATE POLICY "Users can update handover steps for their sessions"
ON public.handover_step_completion
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = handover_step_completion.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);

-- Create corrected RLS policies for identity_verification_checks table
CREATE POLICY "Users can view identity verification checks for their handover sessions"
ON public.identity_verification_checks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = identity_verification_checks.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);

CREATE POLICY "Users can create identity verification checks for their handover sessions"
ON public.identity_verification_checks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = identity_verification_checks.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);

CREATE POLICY "Users can update identity verification checks for their handover sessions"
ON public.identity_verification_checks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM handover_sessions
    WHERE handover_sessions.id = identity_verification_checks.handover_session_id
    AND (
      auth.uid() IN (
        SELECT renter_id FROM bookings WHERE id = handover_sessions.booking_id
        UNION
        SELECT profiles.id FROM profiles
        JOIN cars ON profiles.id = cars.owner_id
        JOIN bookings ON cars.id = bookings.car_id
        WHERE bookings.id = handover_sessions.booking_id
      )
    )
  )
);
