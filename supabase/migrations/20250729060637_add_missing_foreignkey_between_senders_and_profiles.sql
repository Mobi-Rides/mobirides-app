-- This constraint was already added in 20250115000000_fix_conversation_messages_foreign_keys.sql
-- Making this migration safe to re-run (no-op if constraint exists)

DO $$
BEGIN
  -- Only add the constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_conversation_messages_sender_id'
    AND table_name = 'conversation_messages'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE public.conversation_messages 
    ADD CONSTRAINT fk_conversation_messages_sender_id 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added fk_conversation_messages_sender_id constraint.';
  ELSE
    RAISE NOTICE 'Constraint fk_conversation_messages_sender_id already exists, skipping.';
  END IF;
END $$;
