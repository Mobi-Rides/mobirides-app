-- Fix notification_role enum to match code expectations
-- This migration updates the notification_role enum to include 'host_only' and 'renter_only'
-- which are expected by the application code and used in RLS policies

-- Step 1: Add the missing enum values
DO $$
BEGIN
  -- Add 'host_only' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_role')
    AND enumlabel = 'host_only'
  ) THEN
    ALTER TYPE notification_role ADD VALUE 'host_only';
  END IF;

  -- Add 'renter_only' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_role')
    AND enumlabel = 'renter_only'
  ) THEN
    ALTER TYPE notification_role ADD VALUE 'renter_only';
  END IF;
END $$;

-- Step 2: Update existing notifications to use the new role values
-- This ensures backward compatibility by mapping old values to new ones
UPDATE notifications
SET role_target = 'host_only'::notification_role
WHERE role_target = 'host'::notification_role;

UPDATE notifications
SET role_target = 'renter_only'::notification_role
WHERE role_target = 'renter'::notification_role;

-- Step 3: Add comment explaining the enum values
COMMENT ON TYPE notification_role IS
'Notification role targeting: system_wide (all users), host_only (car owners), renter_only (booking renters), admin (administrators), both (hosts and renters)';

-- Step 4: Verify the enum now contains the expected values
DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_role');

    RAISE NOTICE 'notification_role enum values: %', enum_values;
END $$;
