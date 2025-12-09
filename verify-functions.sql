-- Test script to verify SECURITY DEFINER functions were created
-- Run this against your Supabase database to verify the functions exist

-- Check if functions exist
SELECT 
  proname as function_name,
  prosrc as function_body,
  provolatile as volatility,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname IN ('has_verification_admin_access', 'is_profile_admin', 'is_super_admin_from_admins', 'is_admin', 'is_super_admin')
AND pronamespace = 'public'::regnamespace;

-- Test function execution (if you have admin access)
-- SELECT public.has_verification_admin_access();
-- SELECT public.is_profile_admin();
-- SELECT public.is_super_admin_from_admins();
-- SELECT public.is_admin();
-- SELECT public.is_super_admin();

-- Check if policies were created
SELECT polname as policy_name,
       polcmd as command,
       polroles::regrole[] as roles,
       polqual as qualification
FROM pg_policy 
WHERE polname IN ('verification_admin_read_all_complex')
AND polrelid = 'storage.objects'::regclass;

-- Verify grants
SELECT * FROM information_schema.role_routine_grants 
WHERE routine_name IN ('has_verification_admin_access', 'is_profile_admin', 'is_super_admin_from_admins', 'is_admin', 'is_super_admin')
AND grantee = 'authenticated';