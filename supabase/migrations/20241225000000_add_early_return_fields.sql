-- Add early return tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN early_return BOOLEAN DEFAULT false,
ADD COLUMN actual_end_date TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.early_return IS 'Flag to indicate if the booking was returned early';
COMMENT ON COLUMN public.bookings.actual_end_date IS 'Actual date and time when the booking was completed/returned';

-- Create index for performance on early return queries
CREATE INDEX idx_bookings_early_return ON public.bookings(early_return) WHERE early_return = true;
CREATE INDEX idx_bookings_actual_end_date ON public.bookings(actual_end_date);