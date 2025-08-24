-- Create auth_uid_test function to verify authentication context
CREATE OR REPLACE FUNCTION auth_uid_test()
RETURNS TABLE (
  current_user_id UUID,
  is_authenticated BOOLEAN,
  session_info TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.uid() IS NOT NULL) as is_authenticated,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'Valid session'
      ELSE 'No session or auth.uid() is null'
    END as session_info;
END;
$$;