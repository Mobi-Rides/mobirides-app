-- =====================================================
-- Recovery Migration: Create vehicle_condition_reports table
-- Date: November 20, 2025
-- Purpose: Recover vehicle_condition_reports table that was missing from canonical migrations
-- Source: Archived migration - uuid-migrations/20250617110215-create_vehicle_condition_reports_table.sql
-- =====================================================

-- Create vehicle condition reports table for comprehensive inspection documentation
CREATE TABLE IF NOT EXISTS public.vehicle_condition_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES public.handover_sessions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('pickup', 'return')),
  vehicle_photos JSONB DEFAULT '[]'::jsonb, -- Array of photo objects with type, url, description
  damage_reports JSONB DEFAULT '[]'::jsonb, -- Array of damage objects with location, severity, description, photos
  fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100),
  mileage INTEGER,
  exterior_condition_notes TEXT,
  interior_condition_notes TEXT,
  additional_notes TEXT,
  digital_signature_data TEXT, -- Base64 signature or acknowledgment timestamp
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_condition_reports_handover_session_id ON public.vehicle_condition_reports(handover_session_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_condition_reports_booking_id ON public.vehicle_condition_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_condition_reports_car_id ON public.vehicle_condition_reports(car_id);

-- Enable RLS
ALTER TABLE public.vehicle_condition_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_condition_reports
-- Users can view condition reports for their handovers
DROP POLICY IF EXISTS "Users can view condition reports for their handovers" ON public.vehicle_condition_reports;
CREATE POLICY "Users can view condition reports for their handovers"
  ON public.vehicle_condition_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = vehicle_condition_reports.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Users can create condition reports for their handovers
DROP POLICY IF EXISTS "Users can create condition reports for their handovers" ON public.vehicle_condition_reports;
CREATE POLICY "Users can create condition reports for their handovers"
  ON public.vehicle_condition_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs
      WHERE hs.id = vehicle_condition_reports.handover_session_id
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND reporter_id = auth.uid()
  );

-- Users can update their own condition reports
DROP POLICY IF EXISTS "Users can update their own condition reports" ON public.vehicle_condition_reports;
CREATE POLICY "Users can update their own condition reports"
  ON public.vehicle_condition_reports
  FOR UPDATE
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE public.vehicle_condition_reports IS 'Documents vehicle condition at pickup and return for damage tracking';



