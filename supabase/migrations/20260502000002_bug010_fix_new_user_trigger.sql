-- BUG-010: Restore profile creation on signup.
-- Adds a dedicated trigger (on_auth_user_created_profile) that runs alongside
-- the existing welcome-email trigger (on_auth_user_created).
-- The welcome-email trigger is intentionally left untouched.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, created_at, updated_at)
  VALUES (NEW.id, 'renter', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

COMMENT ON FUNCTION public.handle_new_user_profile() IS
  'BUG-010 fix: creates a profile row for every new auth.users signup. '
  'Runs alongside handle_new_user_welcome_email via a separate trigger.';
