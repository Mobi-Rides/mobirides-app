-- Check if vehicle_condition_reports table exists and create RLS policies
-- First, let's create the table if it doesn't exist (with proper structure)
CREATE TABLE IF NOT EXISTS public.vehicle_condition_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    handover_session_id UUID REFERENCES public.handover_sessions(id),
    booking_id UUID REFERENCES public.bookings(id),
    car_id UUID REFERENCES public.cars(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('pickup', 'return')),
    vehicle_photos JSONB DEFAULT '[]'::jsonb,
    damage_reports JSONB DEFAULT '[]'::jsonb,
    fuel_level INTEGER,
    mileage INTEGER,
    digital_signature_data TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    reporter_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_condition_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view vehicle condition reports for their bookings" ON public.vehicle_condition_reports;
DROP POLICY IF EXISTS "Users can create vehicle condition reports for their bookings" ON public.vehicle_condition_reports;
DROP POLICY IF EXISTS "Users can update vehicle condition reports for their bookings" ON public.vehicle_condition_reports;

-- Create RLS policies for vehicle_condition_reports
-- Allow users to view reports for bookings they're involved in (as host or renter)
DROP POLICY IF EXISTS "Users can view vehicle condition reports for their bookings" ON public.vehicle_condition_reports;
CREATE POLICY "Users can view vehicle condition reports for their bookings"
ON public.vehicle_condition_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        LEFT JOIN public.cars c ON b.car_id = c.id
        WHERE b.id = vehicle_condition_reports.booking_id
        AND (b.renter_id = auth.uid() OR c.owner_id = auth.uid())
    )
);

-- Allow users to create reports for bookings they're involved in
DROP POLICY IF EXISTS "Users can create vehicle condition reports for their bookings" ON public.vehicle_condition_reports;
CREATE POLICY "Users can create vehicle condition reports for their bookings"
ON public.vehicle_condition_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings b
        LEFT JOIN public.cars c ON b.car_id = c.id
        WHERE b.id = vehicle_condition_reports.booking_id
        AND (b.renter_id = auth.uid() OR c.owner_id = auth.uid())
    )
    AND reporter_id = auth.uid()
);

-- Allow users to update reports they created
DROP POLICY IF EXISTS "Users can update vehicle condition reports for their bookings" ON public.vehicle_condition_reports;
CREATE POLICY "Users can update vehicle condition reports for their bookings"
ON public.vehicle_condition_reports
FOR UPDATE
USING (reporter_id = auth.uid())
WITH CHECK (reporter_id = auth.uid());
