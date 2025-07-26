-- Insert super admin user (maphanyane@mobirides.com)
-- First we need to find or create the user profile
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if user exists in auth.users by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'maphanyane@mobirides.com';
    
    -- If user exists, add to admins table
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admins (id, email, full_name, is_super_admin)
        VALUES (admin_user_id, 'maphanyane@mobirides.com', 'Maphanyane Mobi Rides', true)
        ON CONFLICT (id) DO UPDATE SET
            is_super_admin = true,
            email = 'maphanyane@mobirides.com',
            full_name = 'Maphanyane Mobi Rides',
            updated_at = NOW();
            
        -- Also update profile role
        INSERT INTO public.profiles (id, role, full_name)
        VALUES (admin_user_id, 'admin', 'Maphanyane Mobi Rides')
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            full_name = 'Maphanyane Mobi Rides',
            updated_at = NOW();
    ELSE
        -- Log that user doesn't exist yet
        RAISE NOTICE 'User with email maphanyane@mobirides.com not found in auth.users. They need to sign up first.';
    END IF;
END $$;