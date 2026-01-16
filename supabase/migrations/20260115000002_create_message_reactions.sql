
-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent multiple reactions of same emoji by same user on same message
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reactions_unique ON public.message_reactions(message_id, user_id, emoji);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view reactions for messages they can see" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_messages cm
            JOIN public.conversation_participants cp ON cm.conversation_id = cp.conversation_id
            WHERE cm.id = message_reactions.message_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages they can see" ON public.message_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_messages cm
            JOIN public.conversation_participants cp ON cm.conversation_id = cp.conversation_id
            WHERE cm.id = message_reactions.message_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;
