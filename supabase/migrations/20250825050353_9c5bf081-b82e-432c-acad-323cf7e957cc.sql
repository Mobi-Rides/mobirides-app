-- Clear all existing RLS policies except temporary ones
-- Drop existing conversation_messages policies
DROP POLICY IF EXISTS "authenticated_users_can_insert_messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "users_can_view_messages_in_their_conversations" ON public.conversation_messages;
DROP POLICY IF EXISTS "users_can_update_their_own_messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "users_can_delete_their_own_messages" ON public.conversation_messages;

-- Drop existing conversation_participants policies  
DROP POLICY IF EXISTS "authenticated_users_can_add_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "users_can_view_participants_in_their_conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_members_can_manage_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "users_can_leave_conversations" ON public.conversation_participants;

-- Drop existing conversations policies
DROP POLICY IF EXISTS "authenticated_users_can_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_can_view_their_conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversation_creators_can_update_conversations" ON public.conversations;

-- Create simplified RLS policies without redundant auth.uid() IS NOT NULL checks
-- CONVERSATION_MESSAGES Policies
CREATE POLICY "authenticated_users_can_insert_messages" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users_can_view_messages_in_their_conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_update_their_own_messages" 
ON public.conversation_messages 
FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "users_can_delete_their_own_messages" 
ON public.conversation_messages 
FOR DELETE 
USING (sender_id = auth.uid());

-- CONVERSATION_PARTICIPANTS Policies
CREATE POLICY "authenticated_users_can_add_participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_participants.conversation_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "users_can_view_participants_in_their_conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "conversation_members_can_manage_participants" 
ON public.conversation_participants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_leave_conversations" 
ON public.conversation_participants 
FOR DELETE 
USING (user_id = auth.uid());

-- CONVERSATIONS Policies
CREATE POLICY "authenticated_users_can_create_conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_can_view_their_conversations" 
ON public.conversations 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "conversation_creators_can_update_conversations" 
ON public.conversations 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Create secure RPC function for sending messages
CREATE OR REPLACE FUNCTION public.send_conversation_message(
  p_conversation_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_related_car_id uuid DEFAULT NULL
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_message_id uuid;
  v_is_participant boolean;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  -- Log authentication context for debugging
  RAISE LOG 'send_conversation_message: user_id=%, conversation_id=%', v_user_id, p_conversation_id;
  
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'authentication_required',
      'message', 'User must be authenticated to send messages'
    );
  END IF;
  
  -- Check if user is a participant in the conversation
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = v_user_id
  ) INTO v_is_participant;
  
  IF NOT v_is_participant THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'access_denied',
      'message', 'User is not a participant in this conversation'
    );
  END IF;
  
  -- Insert the message
  INSERT INTO public.conversation_messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    related_car_id
  ) VALUES (
    p_conversation_id,
    v_user_id,
    p_content,
    p_message_type,
    p_related_car_id
  ) RETURNING id INTO v_message_id;
  
  -- Build successful response
  v_result := jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'sender_id', v_user_id,
    'conversation_id', p_conversation_id
  );
  
  RAISE LOG 'send_conversation_message: Success - message_id=%', v_message_id;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'send_conversation_message: Error - %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', 'Failed to send message: ' || SQLERRM
    );
END;
$$;

-- Create function to validate conversation access
CREATE OR REPLACE FUNCTION public.validate_conversation_access(
  p_conversation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_participant boolean;
  v_is_creator boolean;
BEGIN
  -- Validate authentication
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'error', 'authentication_required'
    );
  END IF;
  
  -- Check participant status
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) INTO v_is_participant;
  
  -- Check creator status
  SELECT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = p_conversation_id AND created_by = p_user_id
  ) INTO v_is_creator;
  
  RETURN jsonb_build_object(
    'has_access', (v_is_participant OR v_is_creator),
    'is_participant', v_is_participant,
    'is_creator', v_is_creator
  );
END;
$$;