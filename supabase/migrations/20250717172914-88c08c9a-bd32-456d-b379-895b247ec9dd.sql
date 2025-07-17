
-- Create handover_step_completion table
CREATE TABLE public.handover_step_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES handover_sessions(id),
  step_name VARCHAR NOT NULL,
  step_order INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completion_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.handover_step_completion ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view handover steps for their sessions
CREATE POLICY "Users can view handover steps for their sessions" 
  ON public.handover_step_completion 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = handover_step_completion.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Policy: Users can manage handover steps for their sessions
CREATE POLICY "Users can manage handover steps for their sessions" 
  ON public.handover_step_completion 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = handover_step_completion.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Create vehicle_condition_reports table
CREATE TABLE public.vehicle_condition_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES handover_sessions(id),
  booking_id UUID,
  car_id UUID,
  report_type VARCHAR NOT NULL,
  vehicle_photos JSONB DEFAULT '[]'::jsonb,
  damage_reports JSONB DEFAULT '[]'::jsonb,
  fuel_level INTEGER,
  mileage INTEGER,
  exterior_condition_notes TEXT,
  interior_condition_notes TEXT,
  additional_notes TEXT,
  digital_signature_data TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  reporter_id UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for vehicle condition reports
ALTER TABLE public.vehicle_condition_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view condition reports for their handovers
CREATE POLICY "Users can view condition reports for their handovers" 
  ON public.vehicle_condition_reports 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = vehicle_condition_reports.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Policy: Users can create condition reports for their handovers
CREATE POLICY "Users can create condition reports for their handovers" 
  ON public.vehicle_condition_reports 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = vehicle_condition_reports.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND reporter_id = auth.uid()
  );

-- Policy: Users can update their own condition reports
CREATE POLICY "Users can update their own condition reports" 
  ON public.vehicle_condition_reports 
  FOR UPDATE 
  USING (reporter_id = auth.uid());

-- Create identity_verification_checks table
CREATE TABLE public.identity_verification_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES handover_sessions(id),
  verifier_id UUID REFERENCES auth.users(id),
  verified_user_id UUID,
  verification_photo_url TEXT,
  license_photo_url TEXT,
  verification_status VARCHAR DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for identity verification checks
ALTER TABLE public.identity_verification_checks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view identity checks for their handovers
CREATE POLICY "Users can view identity checks for their handovers" 
  ON public.identity_verification_checks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = identity_verification_checks.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Policy: Users can create identity checks for their handovers
CREATE POLICY "Users can create identity checks for their handovers" 
  ON public.identity_verification_checks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_sessions hs 
      WHERE hs.id = identity_verification_checks.handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND verifier_id = auth.uid()
  );
