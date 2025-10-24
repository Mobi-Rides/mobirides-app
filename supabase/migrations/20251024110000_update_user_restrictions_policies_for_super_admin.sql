-- Migration: Allow both admin and super_admin to manage user restrictions
-- Date: 2025-10-24

-- Drop old policies
DROP POLICY IF EXISTS "admins_view_restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "admins_create_restrictions" ON user_restrictions;
DROP POLICY IF EXISTS "admins_update_restrictions" ON user_restrictions;

-- Create new policies for admin and super_admin
CREATE POLICY "admins_and_superadmins_view_restrictions" ON user_restrictions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "admins_and_superadmins_create_restrictions" ON user_restrictions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "admins_and_superadmins_update_restrictions" ON user_restrictions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

-- Add comments for clarity
COMMENT ON POLICY "admins_and_superadmins_view_restrictions" ON user_restrictions IS
'Allows admin and super_admin users to view all user restrictions';

COMMENT ON POLICY "admins_and_superadmins_create_restrictions" ON user_restrictions IS
'Allows admin and super_admin users to create user restrictions';

COMMENT ON POLICY "admins_and_superadmins_update_restrictions" ON user_restrictions IS
'Allows admin and super_admin users to update user restrictions';
