-- Fix foreign key structure confusion in conversation_messages.sender_id
-- Remove duplicate foreign key constraint to auth.users and keep only profiles reference

-- Step 1: Remove the conflicting foreign key constraint to auth.users
ALTER TABLE public.conversation_messages 
DROP CONSTRAINT IF EXISTS conversation_messages_sender_id_fkey;

-- Step 2: Ensure data consistency - verify all sender_ids exist in profiles
-- This query will show any orphaned records (should be empty if data is consistent)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.conversation_messages cm
  LEFT JOIN public.profiles p ON cm.sender_id = p.id
  WHERE p.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Found % conversation messages with sender_id not in profiles table. Data cleanup required before migration.', orphaned_count;
  END IF;
  
  RAISE NOTICE 'Data consistency check passed. All sender_ids exist in profiles table.';
END;
$$;

-- Step 3: The profiles foreign key constraint already exists (fk_conversation_messages_sender_id)
-- Verify it exists and is properly configured
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_conversation_messages_sender_id'
    AND table_name = 'conversation_messages'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE public.conversation_messages 
    ADD CONSTRAINT fk_conversation_messages_sender_id 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint to profiles table.';
  ELSE
    RAISE NOTICE 'Foreign key constraint to profiles already exists.';
  END IF;
END;
$$;

-- Step 4: Update any queries or functions that might be using auth.users directly
-- Note: This migration focuses on schema fixes. Frontend code updates will be handled separately.

DO $$
BEGIN
  RAISE NOTICE 'Foreign key structure standardization completed. conversation_messages.sender_id now references only profiles(id).';
END;
$$;