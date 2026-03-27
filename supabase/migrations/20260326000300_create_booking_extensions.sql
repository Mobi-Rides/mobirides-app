-- Create booking_extensions table for rental extension requests
CREATE TABLE IF NOT EXISTS public.booking_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_end_date DATE NOT NULL,
  requested_end_date DATE NOT NULL,
  additional_days INTEGER NOT NULL,
  additional_cost NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_extensions_booking_id ON public.booking_extensions(booking_id);
CREATE INDEX idx_booking_extensions_requested_by ON public.booking_extensions(requested_by);

ALTER TABLE public.booking_extensions ENABLE ROW LEVEL SECURITY;

-- Renter can insert and view their own extensions
CREATE POLICY "Renters can create extension requests"
  ON public.booking_extensions FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can view extensions for their bookings"
  ON public.booking_extensions FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.cars c ON c.id = b.car_id
      WHERE b.id = booking_id AND c.owner_id = auth.uid()
    )
  );

-- Host can update status (approve/reject)
CREATE POLICY "Hosts can update extension status"
  ON public.booking_extensions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.cars c ON c.id = b.car_id
      WHERE b.id = booking_id AND c.owner_id = auth.uid()
    )
  );
