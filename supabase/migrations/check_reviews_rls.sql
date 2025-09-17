-- Check RLS policies on reviews table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reviews';

-- Check if RLS is enabled on reviews table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'reviews';

-- Check permissions for anon and authenticated roles
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'reviews'
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;