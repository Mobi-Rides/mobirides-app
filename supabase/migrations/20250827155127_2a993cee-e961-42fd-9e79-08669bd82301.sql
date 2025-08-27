-- Update the handle_new_user function to include phone_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile record for the new user with phone_number
  INSERT INTO public.profiles (id, role, full_name, phone_number, created_at, updated_at)
  VALUES (
    NEW.id,
    'renter'::user_role,  -- Default role
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),  -- Use full_name from metadata or email as fallback
    NEW.raw_user_meta_data->>'phone_number',  -- Get phone_number from signup metadata
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore the error
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;