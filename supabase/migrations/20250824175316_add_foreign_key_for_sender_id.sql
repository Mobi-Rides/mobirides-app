-- Add foreign key constraint for sender_id in conversation_messages
ALTER TABLE public.conversation_messages 
ADD CONSTRAINT conversation_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;