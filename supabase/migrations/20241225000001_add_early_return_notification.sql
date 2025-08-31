-- Add early_return_notification to the notification_type enum
DO $$ 
BEGIN
    -- Add early_return_notification type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'early_return_notification' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'early_return_notification';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TYPE notification_type IS 'Notification types including early_return_notification for early return events';