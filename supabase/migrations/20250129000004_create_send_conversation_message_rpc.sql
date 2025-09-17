-- Create send_conversation_message RPC function
-- This function provides secure message sending with authentication and validation

CREATE OR REPLACE FUNCTION public.send_conversation_message(
  p_conversation_id UUID,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_participant_exists BOOLEAN;
  v_message_id UUID;
  v_result JSON;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Log the function call for debugging
  RAISE LOG 'send_conversation_message called: user_id=%, conversation_id=%, content_length=%', 
    v_user_id, p_conversation_id, LENGTH(p_content);
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated' USING ERRCODE = 'UNAUTHENTICATED';
  END IF;
  
  -- Validate input parameters
  IF p_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation ID is required' USING ERRCODE = 'INVALID_PARAMETER_VALUE';
  END IF;
  
  IF p_content IS NULL OR TRIM(p_content) = '' THEN
    RAISE EXCEPTION 'Message content cannot be empty' USING ERRCODE = 'INVALID_PARAMETER_VALUE';
  END IF;
  
  IF LENGTH(TRIM(p_content)) > 5000 THEN
    RAISE EXCEPTION 'Message content too long (max 5000 characters)' USING ERRCODE = 'INVALID_PARAMETER_VALUE';
  END IF;
  
  -- Check if user is a participant in the conversation
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = v_user_id
  ) INTO v_participant_exists;
  
  IF NOT v_participant_exists THEN
    RAISE EXCEPTION 'User is not a participant in this conversation' USING ERRCODE = 'INSUFFICIENT_PRIVILEGE';
  END IF;
  
  -- Generate a new UUID for the message
  v_message_id := gen_random_uuid();
  
  -- Insert the message
  INSERT INTO conversation_messages (
    id,
    conversation_id,
    sender_id,
    content,
    message_type,
    created_at,
    updated_at
  ) VALUES (
    v_message_id,
    p_conversation_id,
    v_user_id,
    TRIM(p_content),
    p_message_type,
    NOW(),
    NOW()
  );
  
  -- Prepare the result
  v_result := json_build_object(
    'success', true,
    'message_id', v_message_id,
    'conversation_id', p_conversation_id,
    'sender_id', v_user_id,
    'content', TRIM(p_content),
    'message_type', p_message_type,
    'created_at', NOW()
  );
  
  RAISE LOG 'Message sent successfully: message_id=%, conversation_id=%', v_message_id, p_conversation_id;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in send_conversation_message: % - %', SQLSTATE, SQLERRM;
    
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_conversation_message(UUID, TEXT, TEXT) TO authenticated;

-- Revoke from anon users for security
REVOKE EXECUTE ON FUNCTION public.send_conversation_message(UUID, TEXT, TEXT) FROM anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.send_conversation_message(UUID, TEXT, TEXT) IS 
'Securely sends a message to a conversation with authentication and validation checks';