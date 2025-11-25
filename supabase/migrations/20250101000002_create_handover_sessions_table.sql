-- =====================================================
-- Recovery Migration: Create handover_sessions table
-- Date: November 20, 2025
-- Purpose: Recover handover_sessions table that was missing from canonical migrations
-- CRITICAL: This table is referenced by 18+ migrations and never had a CREATE TABLE statement
-- Source: Schema extracted from types.ts and archived RLS policy migrations
-- =====================================================

-- Create handover_sessions table
CREATE TABLE IF NOT EXISTS public.handover_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    handover_type handover_type NOT NULL DEFAULT 'pickup',
    host_ready BOOLEAN DEFAULT false,
    renter_ready BOOLEAN DEFAULT false,
    host_location JSONB,
    renter_location JSONB,
    handover_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_handover_sessions_booking_id ON public.handover_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_handover_sessions_host_id ON public.handover_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_handover_sessions_renter_id ON public.handover_sessions(renter_id);
CREATE INDEX IF NOT EXISTS idx_handover_sessions_booking_type ON public.handover_sessions(booking_id, handover_type);
CREATE INDEX IF NOT EXISTS idx_handover_sessions_created_at ON public.handover_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.handover_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for handover_sessions
-- Users can view their own handover sessions (as host or renter)
DROP POLICY IF EXISTS "Users can view their own handover sessions" ON public.handover_sessions;
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

-- Users can create handover sessions for their bookings
DROP POLICY IF EXISTS "Users can create handover sessions for their bookings" ON public.handover_sessions;
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

-- Users can update their own handover sessions
DROP POLICY IF EXISTS "Users can update their own handover sessions" ON public.handover_sessions;
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

-- Add comments for documentation
COMMENT ON TABLE public.handover_sessions IS 'Tracks handover sessions between hosts and renters for vehicle pickup and return';
COMMENT ON COLUMN public.handover_sessions.handover_type IS 'Type of handover session: pickup (start of rental) or return (end of rental)';



