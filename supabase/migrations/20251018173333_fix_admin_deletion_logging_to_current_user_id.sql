-- Fix admin deletion logging to use current user's ID instead of deleted admin's ID
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_activity(
      NEW.id,
      'admin_created',
      'admin',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'is_super_admin', NEW.is_super_admin)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_admin_activity(
      NEW.id,
      'admin_updated',
      'admin',
      NEW.id,
      jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Use auth.uid() (current user performing deletion) instead of OLD.id
    PERFORM public.log_admin_activity(
      auth.uid(),
      'admin_deleted',
      'admin',
      OLD.id,
      jsonb_build_object('deleted_admin_email', OLD.email, 'deleted_admin_name', OLD.full_name)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;