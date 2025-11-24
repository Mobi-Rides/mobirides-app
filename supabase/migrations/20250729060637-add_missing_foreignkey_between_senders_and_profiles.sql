-- Add missing foreign key constraint between conversation_messages.sender_id and profiles.id
ALTER TABLE public.conversation_messages 
ADD CONSTRAINT fk_conversation_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure profiles table has proper RLS for message queries
-- This policy already exists but ensuring it's there for message loading