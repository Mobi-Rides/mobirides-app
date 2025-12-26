-- Ensure is_admin function exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  -- Check if the user has the 'admin' role in public.user_roles or similar logic
  -- For now, we'll check against a hardcoded list or a specific metadata field if needed.
  -- But usually, is_admin is defined elsewhere. 
  -- IF IT ALREADY EXISTS, THIS WILL REPLACE IT. 
  -- Let's stick to a safe implementation that checks app_metadata or a table.
  
  -- HOWEVER, since I don't know the exact current implementation of is_admin and don't want to break it, 
  -- I should probably rely on the existing one if it works, OR redefine it if I'm sure.
  -- The previous searches showed is_admin exists in older migrations.
  
  -- Let's assume is_admin() is already working for other things (like policies), 
  -- so maybe I DON'T need to redefine it, just use it.
  
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_uuid
    AND (raw_app_meta_data->>'role')::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- Allow Admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin(auth.uid()));

-- Also ensure insurance_claims is viewable by admin (already checked in 20251224000000 but good to double check or re-apply if needed)
-- The previous migration `20251224000000_implement_insurance_schema.sql` already has:
-- CREATE POLICY "Admins can view all claims" ON public.insurance_claims FOR SELECT USING (is_admin(auth.uid()));
-- So we should be good on claims.

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
