-- Fix create_conversation_secure function to handle duplicates and improve RLS visibility
CREATE OR REPLACE FUNCTION public.create_conversation_secure(
  p_title text DEFAULT NULL::text, 
  p_type text DEFAULT 'direct'::text, 
  p_participant_ids uuid[] DEFAULT '{}'::uuid[], 
  p_created_by_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid;
  v_participant_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID or use provided ID
  v_user_id := COALESCE(p_created_by_id, auth.uid());
  
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: No valid user ID found';
  END IF;
  
  -- Check if direct conversation already exists (for direct messages only)
  IF p_type = 'direct' AND array_length(p_participant_ids, 1) = 1 THEN
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = v_user_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_participant_ids[1]
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_participants cp 
      WHERE cp.conversation_id = c.id
    ) = 2;
    
    IF v_conversation_id IS NOT NULL THEN
      RAISE LOG 'create_conversation_secure: Found existing conversation %', v_conversation_id;
      
      -- Return existing conversation with proper structure
      SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'type', c.type,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'exists', true
      ) INTO v_result
      FROM public.conversations c
      WHERE c.id = v_conversation_id;
      
      RETURN v_result;
    END IF;
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations (
    title,
    type,
    created_by
  ) VALUES (
    p_title,
    p_type,
    v_user_id
  ) RETURNING id INTO v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Created conversation % for user %', v_conversation_id, v_user_id;
  
  -- Add creator as participant using INSERT ... ON CONFLICT DO NOTHING
  INSERT INTO public.conversation_participants (
    conversation_id,
    user_id
  ) VALUES (
    v_conversation_id,
    v_user_id
  ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Add other participants
  IF p_participant_ids IS NOT NULL AND array_length(p_participant_ids, 1) > 0 THEN
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
      -- Skip if participant is the creator (already added)
      IF v_participant_id != v_user_id THEN
        INSERT INTO public.conversation_participants (
          conversation_id,
          user_id
        ) VALUES (
          v_conversation_id,
          v_participant_id
        ) ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        RAISE LOG 'create_conversation_secure: Added participant % to conversation %', v_participant_id, v_conversation_id;
      END IF;
    END LOOP;
  END IF;
  
  -- Build and return result
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'type', c.type,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'exists', false
  ) INTO v_result
  FROM public.conversations c
  WHERE c.id = v_conversation_id;
  
  RAISE LOG 'create_conversation_secure: Successfully created conversation % with result %', v_conversation_id, v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'create_conversation_secure: Error for user %: % %', v_user_id, SQLSTATE, SQLERRM;
    RAISE;
END;
$function$;