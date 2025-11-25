-- Create conversations table for managing message conversations
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create conversation_participants table for managing who's in each conversation
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create conversation_messages table for the new message structure
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to_message_id UUID REFERENCES public.conversation_messages(id),
  related_car_id UUID REFERENCES public.cars(id),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);
CREATE INDEX idx_conversation_messages_sender_id ON public.conversation_messages(sender_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations 
FOR UPDATE 
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for conversation_participants
CREATE POLICY "Users can view participants of conversations they're in" 
ON public.conversation_participants 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.conversation_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for conversation_messages
CREATE POLICY "Users can view messages in conversations they participate in" 
ON public.conversation_messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to conversations they participate in" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.conversation_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Create function to update conversation timestamp when new message is added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic conversation timestamp updates
CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Migrate existing messages to new structure
DO $$
DECLARE
  message_record RECORD;
  conversation_record RECORD;
  new_conversation_id UUID;
BEGIN
  -- Create conversations from existing message pairs
  FOR message_record IN (
    SELECT DISTINCT 
      LEAST(sender_id, receiver_id) as user1_id,
      GREATEST(sender_id, receiver_id) as user2_id,
      MIN(created_at) as first_message_at,
      related_car_id
    FROM public.messages
    GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), related_car_id
  ) LOOP
    -- Create new conversation
    INSERT INTO public.conversations (created_by, created_at, updated_at)
    VALUES (message_record.user1_id, message_record.first_message_at, message_record.first_message_at)
    RETURNING id INTO new_conversation_id;
    
    -- Add participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
    VALUES 
      (new_conversation_id, message_record.user1_id, message_record.first_message_at),
      (new_conversation_id, message_record.user2_id, message_record.first_message_at);
    
    -- Migrate messages to new format
    INSERT INTO public.conversation_messages (
      conversation_id, 
      sender_id, 
      content, 
      created_at, 
      updated_at,
      related_car_id,
      metadata
    )
    SELECT 
      new_conversation_id,
      sender_id,
      content,
      created_at,
      updated_at,
      related_car_id,
      jsonb_build_object('migrated_from_old_messages', true, 'original_receiver_id', receiver_id)
    FROM public.messages
    WHERE 
      (sender_id = message_record.user1_id AND receiver_id = message_record.user2_id) OR
      (sender_id = message_record.user2_id AND receiver_id = message_record.user1_id)
      AND (related_car_id = message_record.related_car_id OR (related_car_id IS NULL AND message_record.related_car_id IS NULL))
    ORDER BY created_at;
    
  END LOOP;
END $$;