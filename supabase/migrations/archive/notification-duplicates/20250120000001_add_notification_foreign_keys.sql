-- Add missing foreign key constraints for notifications table
-- This fixes the schema relationship error that prevents notifications from loading

-- Add foreign key constraint for related_booking_id
ALTER TABLE notifications 
ADD CONSTRAINT notifications_related_booking_id_fkey 
FOREIGN KEY (related_booking_id) 
REFERENCES bookings(id) 
ON DELETE SET NULL;

-- Add foreign key constraint for related_car_id
ALTER TABLE notifications 
ADD CONSTRAINT notifications_related_car_id_fkey 
FOREIGN KEY (related_car_id) 
REFERENCES cars(id) 
ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_related_booking_id 
ON notifications(related_booking_id) 
WHERE related_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_car_id 
ON notifications(related_car_id) 
WHERE related_car_id IS NOT NULL;

-- Add index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id) 
WHERE user_id IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;