-- Fix send_conversation_message function overloading conflict
-- Drop all existing versions and create a single comprehensive function

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.send_conversation_message(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.send_conversation_message(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.send_conversation_message(UUID, TEXT, CHARACTER VARYING, UUID, UUID, JSONB);

-- Create a single comprehensive function with all optional parameters
CREATE OR REPLACE FUNCTION public.send_conversation_message(
    p_conversation_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_related_car_id UUID DEFAULT NULL,
    p_reply_to_message_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
    v_participant_exists BOOLEAN;
    v_result JSON;
BEGIN
    -- Get the authenticated user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Validate required parameters
    IF p_conversation_id IS NULL OR p_content IS NULL OR trim(p_content) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Missing required parameters: conversation_id and content'
        );
    END IF;
    
    -- Check if user is a participant in the conversation
    SELECT EXISTS(
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = v_user_id
    ) INTO v_participant_exists;
    
    IF NOT v_participant_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User is not a participant in this conversation'
        );
    END IF;
    
    -- Validate reply_to_message_id if provided
    IF p_reply_to_message_id IS NOT NULL THEN
        IF NOT EXISTS(
            SELECT 1 FROM conversation_messages 
            WHERE id = p_reply_to_message_id 
            AND conversation_id = p_conversation_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Reply message not found in this conversation'
            );
        END IF;
    END IF;
    
    -- Validate related_car_id if provided
    IF p_related_car_id IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM cars WHERE id = p_related_car_id) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Related car not found'
            );
        END IF;
    END IF;
    
    -- Insert the message
    INSERT INTO conversation_messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        related_car_id,
        reply_to_message_id,
        metadata
    ) VALUES (
        p_conversation_id,
        v_user_id,
        p_content,
        p_message_type,
        p_related_car_id,
        p_reply_to_message_id,
        p_metadata
    ) RETURNING id INTO v_message_id;
    
    -- Update conversation's last_message_at
    UPDATE conversations 
    SET 
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    -- Return success with message details
    RETURN json_build_object(
        'success', true,
        'message_id', v_message_id,
        'conversation_id', p_conversation_id,
        'sender_id', v_user_id,
        'content', p_content,
        'message_type', p_message_type,
        'related_car_id', p_related_car_id,
        'reply_to_message_id', p_reply_to_message_id,
        'metadata', p_metadata,
        'created_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to send message: ' || SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_conversation_message(UUID, TEXT, TEXT, UUID, UUID, JSONB) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.send_conversation_message(UUID, TEXT, TEXT, UUID, UUID, JSONB) IS 
'Sends a message to a conversation with optional parameters for car references, replies, and metadata. Handles all message types and validates user permissions.';