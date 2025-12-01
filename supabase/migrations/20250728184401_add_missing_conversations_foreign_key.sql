-- This constraint was already added in 20250115000001_fix_conversations_foreign_keys.sql
-- Keeping this migration file for history but making it safe to re-run
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversation_participants_user_id_fkey'
    AND table_name = 'conversation_participants'
  ) THEN
    ALTER TABLE conversation_participants DROP CONSTRAINT conversation_participants_user_id_fkey;
  END IF;
  
  -- Add the constraint
  ALTER TABLE conversation_participants
  ADD CONSTRAINT conversation_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
END $$;