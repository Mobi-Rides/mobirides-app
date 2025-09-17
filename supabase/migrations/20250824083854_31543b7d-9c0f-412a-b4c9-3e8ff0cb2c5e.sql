-- Phase 1: Database Cleanup - Fix Orphaned Conversations and Database Integrity

-- First, let's identify and clean up orphaned conversations
-- Delete conversations that have only one participant (should have at least 2)
DELETE FROM public.conversations 
WHERE id IN (
  SELECT c.id 
  FROM public.conversations c
  LEFT JOIN (
    SELECT conversation_id, COUNT(*) as participant_count 
    FROM public.conversation_participants 
    GROUP BY conversation_id
  ) pc ON c.id = pc.conversation_id
  WHERE pc.participant_count IS NULL OR pc.participant_count < 2
);

-- Clean up orphaned conversation_participants records
DELETE FROM public.conversation_participants 
WHERE conversation_id NOT IN (SELECT id FROM public.conversations);

-- Clean up orphaned conversation_messages records  
DELETE FROM public.conversation_messages 
WHERE conversation_id NOT IN (SELECT id FROM public.conversations);

-- Update last_message_at timestamps for all valid conversations
UPDATE public.conversations 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM public.conversation_messages 
  WHERE conversation_id = conversations.id
),
updated_at = (
  SELECT MAX(created_at) 
  FROM public.conversation_messages 
  WHERE conversation_id = conversations.id
)
WHERE EXISTS (
  SELECT 1 FROM public.conversation_messages 
  WHERE conversation_id = conversations.id
);

-- Add proper indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);

-- Create function to ensure conversation integrity
CREATE OR REPLACE FUNCTION public.ensure_conversation_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- When a participant is deleted, check if conversation should be deleted
  IF TG_OP = 'DELETE' THEN
    -- If conversation has less than 2 participants after deletion, delete the conversation
    IF (SELECT COUNT(*) FROM public.conversation_participants WHERE conversation_id = OLD.conversation_id) < 2 THEN
      DELETE FROM public.conversations WHERE id = OLD.conversation_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation integrity
DROP TRIGGER IF EXISTS ensure_conversation_integrity_trigger ON public.conversation_participants;
CREATE TRIGGER ensure_conversation_integrity_trigger
  AFTER DELETE ON public.conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_conversation_integrity();

-- Function to validate conversation creation
CREATE OR REPLACE FUNCTION public.validate_conversation_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure direct conversations don't have duplicate participants
  IF NEW.type = 'direct' THEN
    -- Check if a direct conversation already exists between these users
    IF EXISTS (
      SELECT 1 FROM public.conversations c1
      JOIN public.conversation_participants cp1 ON c1.id = cp1.conversation_id
      JOIN public.conversation_participants cp2 ON c1.id = cp2.conversation_id
      WHERE c1.type = 'direct' 
      AND c1.id != NEW.id
      AND cp1.user_id = NEW.created_by
      AND cp2.user_id != NEW.created_by
      AND cp2.user_id IN (
        SELECT user_id FROM public.conversation_participants 
        WHERE conversation_id = NEW.id AND user_id != NEW.created_by
      )
    ) THEN
      RAISE EXCEPTION 'Direct conversation already exists between these users';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation validation  
DROP TRIGGER IF EXISTS validate_conversation_creation_trigger ON public.conversations;
CREATE TRIGGER validate_conversation_creation_trigger
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_creation();