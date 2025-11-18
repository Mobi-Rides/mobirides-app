-- Check and recreate the auth trigger
-- First, let's see what triggers exist on auth.users

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with proper configuration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add a comment for documentation
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger that calls handle_new_user() after a new user is inserted into auth.users';

-- Verify the trigger was created
-- Note: This is just for documentation, the actual verification needs to be done via queries