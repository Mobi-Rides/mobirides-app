-- Add 'audio' to the allowed message types in conversation_messages

-- Drop the existing check constraint
ALTER TABLE conversation_messages 
DROP CONSTRAINT IF EXISTS conversation_messages_message_type_check;

-- Add new check constraint that includes 'audio'
ALTER TABLE conversation_messages 
ADD CONSTRAINT conversation_messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system'));
