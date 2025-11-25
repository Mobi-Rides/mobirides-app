-- Add handover_type field to handover_sessions table
-- This allows us to distinguish between pickup and return handover sessions

-- Create enum for handover types
CREATE TYPE handover_type AS ENUM ('pickup', 'return');

-- Add handover_type column to handover_sessions table
ALTER TABLE handover_sessions 
ADD COLUMN handover_type handover_type NOT NULL DEFAULT 'pickup';

-- Create index for better query performance
CREATE INDEX idx_handover_sessions_booking_type ON handover_sessions(booking_id, handover_type);

-- Update existing sessions to be pickup type (they are all pickup sessions currently)
UPDATE handover_sessions SET handover_type = 'pickup' WHERE handover_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN handover_sessions.handover_type IS 'Type of handover session: pickup (start of rental) or return (end of rental)';