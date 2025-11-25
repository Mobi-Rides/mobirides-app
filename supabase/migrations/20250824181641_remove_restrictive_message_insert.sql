-- Remove the restrictive messages insert policy
DROP POLICY IF EXISTS "messages_insert_policy" ON public.conversation_messages;

-- Also remove any similar named policies that might be blocking inserts
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.conversation_messages;