
-- Create vehicle condition reports table for comprehensive inspection documentation
CREATE TABLE public.vehicle_condition_reports (
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

-- Create identity verification checks table
CREATE TABLE public.identity_verification_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES public.handover_sessions(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who is doing the verification
  verified_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who is being verified
  verification_photo_url TEXT, -- Photo taken during handover for verification
  license_photo_url TEXT, -- License photo for comparison
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create handover steps tracking table
CREATE TABLE public.handover_step_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handover_session_id UUID REFERENCES public.handover_sessions(id) ON DELETE CASCADE,
  step_name VARCHAR(50) NOT NULL,
  step_order INTEGER NOT NULL,
  completed_by UUID REFERENCES public.profiles(id),
  is_completed BOOLEAN DEFAULT FALSE,
  completion_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(handover_session_id, step_name)
);

-- Add emergency contacts to profiles
ALTER TABLE public.profiles 
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN id_photo_url TEXT;

-- Add handover preparation fields to bookings
ALTER TABLE public.bookings 
ADD COLUMN host_preparation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN renter_preparation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN preparation_reminder_sent BOOLEAN DEFAULT FALSE;

-- Enable RLS on new tables
ALTER TABLE public.vehicle_condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_step_completion ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_condition_reports
CREATE POLICY "Users can view condition reports for their handovers" 
  ON public.vehicle_condition_reports 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

CREATE POLICY "Users can create condition reports for their handovers" 
  ON public.vehicle_condition_reports 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND reporter_id = auth.uid()
  );

CREATE POLICY "Users can update their own condition reports" 
  ON public.vehicle_condition_reports 
  FOR UPDATE 
  USING (reporter_id = auth.uid());

-- RLS policies for identity_verification_checks
CREATE POLICY "Users can view identity checks for their handovers" 
  ON public.identity_verification_checks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

CREATE POLICY "Users can create identity checks for their handovers" 
  ON public.identity_verification_checks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
    AND verifier_id = auth.uid()
  );

-- RLS policies for handover_step_completion
CREATE POLICY "Users can view handover steps for their sessions" 
  ON public.handover_step_completion 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage handover steps for their sessions" 
  ON public.handover_step_completion 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.handover_sessions hs 
      WHERE hs.id = handover_session_id 
      AND (hs.host_id = auth.uid() OR hs.renter_id = auth.uid())
    )
  );

-- Create storage bucket for handover photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'handover-photos', 
  'handover-photos', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for handover photos
CREATE POLICY "Users can upload handover photos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'handover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view handover photos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'handover-photos');

CREATE POLICY "Users can update their handover photos" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'handover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their handover photos" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'handover-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
