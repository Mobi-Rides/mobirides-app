-- Add trigger to automatically create notifications when messages are sent
-- This ensures that message_received notifications are created for all conversation participants

-- Create function to handle message notification creation
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender's name from profiles table
  SELECT COALESCE(full_name, email) INTO sender_name
  FROM auth.users 
  WHERE id = NEW.sender_id;
  
  -- If sender name not found, use a default
  IF sender_name IS NULL THEN
    sender_name := 'Unknown User';
  END IF;
  
  -- Create notifications for all conversation participants except the sender
  FOR participant_record IN (
    SELECT user_id 
    FROM public.conversation_participants 
    WHERE conversation_id = NEW.conversation_id 
    AND user_id != NEW.sender_id
  ) LOOP
    -- Call the existing create_message_notification function
    PERFORM public.create_message_notification(
      participant_record.user_id,
      sender_name,
      NEW.content
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after message insertion
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_message_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_message_notification() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_message_notification() IS 'Automatically creates message_received notifications for conversation participants when a new message is sent';
COMMENT ON TRIGGER message_notification_trigger ON public.conversation_messages IS 'Triggers notification creation for new messages';