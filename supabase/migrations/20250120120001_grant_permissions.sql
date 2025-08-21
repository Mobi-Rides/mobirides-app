-- Grant permissions to anon and authenticated roles for conversation tables

-- Grant permissions for conversations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT ON public.conversations TO anon;

-- Grant permissions for conversation_participants table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT ON public.conversation_participants TO anon;

-- Grant permissions for conversation_messages table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_messages TO authenticated;
GRANT SELECT ON public.conversation_messages TO anon;

-- Grant usage on sequences if any exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;