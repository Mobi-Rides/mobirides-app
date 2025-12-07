-- Create conversation_messages_with_replies view
-- This view was previously created via dashboard and is now being added to migrations

CREATE OR REPLACE VIEW public.conversation_messages_with_replies 
WITH (security_invoker = true) AS
SELECT 
    cm.id,
    cm.conversation_id,
    cm.sender_id,
    cm.content,
    cm.message_type,
    cm.created_at,
    cm.updated_at,
    cm.edited,
    cm.edited_at,
    cm.reply_to_message_id,
    cm.related_car_id,
    cm.metadata,
    cm.delivery_status,
    cm.sent_at,
    cm.delivered_at,
    cm.read_at,
    cm.encrypted_content,
    cm.encryption_key_id,
    cm.is_encrypted,
    reply.id AS reply_original_id,
    reply.content AS reply_to_content,
    reply.sender_id AS reply_to_sender_id,
    reply.created_at AS reply_to_created_at,
    reply.message_type AS reply_to_message_type,
    (SELECT count(*) FROM conversation_messages r WHERE r.reply_to_message_id = cm.id) AS reply_count,
    CASE
        WHEN reply.content IS NOT NULL THEN
            CASE
                WHEN length(reply.content) <= 50 THEN reply.content
                ELSE SUBSTRING(reply.content FROM 1 FOR 47) || '...'
            END
        ELSE NULL
    END AS reply_to_preview
FROM conversation_messages cm
LEFT JOIN conversation_messages reply ON cm.reply_to_message_id = reply.id;

-- Grant access to authenticated users
GRANT SELECT ON public.conversation_messages_with_replies TO authenticated;