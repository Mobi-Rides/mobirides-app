-- Migration to cleanup legacy messaging system
-- Superseded by conversation system
-- =================================================

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS "public"."messages_with_replies";

-- Step 2: Drop message_operations (empty, RLS disabled, FK to legacy messages)
DROP TABLE IF EXISTS "public"."message_operations";

-- Step 3: Create archive schema for safety
CREATE SCHEMA IF NOT EXISTS "archive";

-- Step 4: Archive legacy tables (preserves data, removes from public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE "public"."messages" SET SCHEMA "archive";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages_backup_20250930_093926') THEN
    ALTER TABLE "public"."messages_backup_20250930_093926" SET SCHEMA "archive";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications_backup') THEN
    ALTER TABLE "public"."notifications_backup" SET SCHEMA "archive";
  END IF;
END $$;

-- Step 5: Drop empty backup table
DROP TABLE IF EXISTS "public"."notifications_backup2";
