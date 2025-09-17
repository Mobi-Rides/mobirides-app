-- Create function to safely get user email for notifications
CREATE OR REPLACE FUNCTION public.get_user_email_for_notification(user_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get user email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$function$;