-- Fix booking status change trigger that was missing
CREATE OR REPLACE TRIGGER trigger_handle_booking_status_change
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_status_change();

-- Update booking table to include start_time and end_time
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS start_time time without time zone DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS end_time time without time zone DEFAULT '18:00:00';