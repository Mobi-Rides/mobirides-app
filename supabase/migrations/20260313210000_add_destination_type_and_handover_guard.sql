-- MOB-201: Add destination_type to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS destination_type TEXT 
DEFAULT 'local' 
CHECK (destination_type IN ('local', 'out_of_zone', 'cross_border'));

-- MOB-204: Prevent duplicate active handover sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_handover_session 
ON handover_sessions (booking_id, handover_type) 
WHERE handover_completed = false;
