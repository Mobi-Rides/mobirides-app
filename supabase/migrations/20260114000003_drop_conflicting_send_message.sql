-- Drop the conflicting 4-parameter version of send_conversation_message
-- Keep only the 6-parameter version from 20250129000006

DROP FUNCTION IF EXISTS public.send_conversation_message(UUID, TEXT, TEXT, JSONB);
