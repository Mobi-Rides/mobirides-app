
-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = check_column_exists.table_name 
    AND column_name = check_column_exists.column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Function to create the check_column_exists function as an RPC
CREATE OR REPLACE FUNCTION create_check_column_function()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function just exists to be called via RPC to create the check_column_exists function
  -- The actual implementation is in the check_column_exists function above
  NULL;
END;
$$;
