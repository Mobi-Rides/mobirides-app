-- Add unique constraint to prevent notification duplicates
-- This addresses the duplication issue identified in the analysis

-- Add unique constraint to prevent future duplicates
-- Only add if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_notification_per_user_booking'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT unique_notification_per_user_booking 
        UNIQUE (user_id, type, related_booking_id);
    END IF;
END $$;

-- Add index for better notification query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_booking 
ON public.notifications(user_id, type, related_booking_id);

-- Add index for notification listing queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at 
ON public.notifications(user_id, created_at DESC);

-- Add index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read) 
WHERE is_read = false;