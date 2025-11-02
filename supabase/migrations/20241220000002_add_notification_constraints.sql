-- Add notification indexes only (constraint removed - will be added in later migration)
-- The unique constraint has been moved to 20251024062613_safe_dedupe_notifications_final.sql
-- to ensure duplicates are removed first

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
