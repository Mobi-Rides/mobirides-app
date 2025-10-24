-- Migration: Safe deduplication and unique constraint for notifications
-- File: 20251024120000_safe_dedupe_notifications_final.sql
-- This migration safely removes duplicates without data loss
--
-- IMPORTANT: This only removes EXACT duplicates where (user_id, type, related_booking_id) 
-- are identical. It keeps the oldest notification (lowest id) for each group.

BEGIN;

-- Step 1: First, let's check if the constraint already exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_notification_per_user_booking'
    ) THEN
        ALTER TABLE public.notifications
        DROP CONSTRAINT unique_notification_per_user_booking;
        RAISE NOTICE 'Dropped existing constraint';
    END IF;
END $$;

-- Step 2: Create a temporary table to store notifications we want to KEEP
CREATE TEMP TABLE notifications_to_keep AS
SELECT DISTINCT ON (user_id, type, related_booking_id) id
FROM public.notifications
WHERE related_booking_id IS NOT NULL
ORDER BY user_id, type, related_booking_id, id ASC;

-- Step 3: Log how many duplicates we're about to remove (for audit)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM public.notifications
    WHERE related_booking_id IS NOT NULL
    AND id NOT IN (SELECT id FROM notifications_to_keep);
    
    RAISE NOTICE 'About to remove % duplicate notifications', duplicate_count;
END $$;

-- Step 4: Delete the duplicates (keeping the oldest one per group)
-- This uses NOT IN which is safe and won't delete data we want to keep
DELETE FROM public.notifications
WHERE related_booking_id IS NOT NULL
AND id NOT IN (SELECT id FROM notifications_to_keep);

-- Step 5: Final verification - ensure no duplicates remain
DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT user_id, type, related_booking_id, COUNT(*) as cnt
        FROM public.notifications
        WHERE related_booking_id IS NOT NULL
        GROUP BY user_id, type, related_booking_id
        HAVING COUNT(*) > 1
    ) dupes;
    
    IF remaining_duplicates > 0 THEN
        RAISE EXCEPTION 'Still found % duplicate groups after deletion. Aborting constraint creation.', remaining_duplicates;
    ELSE
        RAISE NOTICE 'Successfully removed all duplicates. Safe to add constraint.';
    END IF;
END $$;

-- Step 6: Add the unique constraint
ALTER TABLE public.notifications
ADD CONSTRAINT unique_notification_per_user_booking
UNIQUE (user_id, type, related_booking_id);

-- Step 7: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_booking 
ON public.notifications(user_id, type, related_booking_id)
WHERE related_booking_id IS NOT NULL;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Constraint "unique_notification_per_user_booking" has been added.';
END $$;