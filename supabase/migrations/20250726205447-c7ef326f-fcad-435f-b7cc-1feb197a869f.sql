-- Set current user as super admin since they are already signed in
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the current authenticated user ID
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Add to admins table
        INSERT INTO public.admins (id, email, full_name, is_super_admin)
        VALUES (current_user_id, 'maphanyane@mobirides.com', 'Maphanyane Mobi Rides', true)
        ON CONFLICT (id) DO UPDATE SET
            is_super_admin = true,
            email = 'maphanyane@mobirides.com',
            full_name = 'Maphanyane Mobi Rides',
            updated_at = NOW();
            
        -- Update profile role
        UPDATE public.profiles 
        SET role = 'admin', 
            full_name = COALESCE(full_name, 'Maphanyane Mobi Rides'),
            updated_at = NOW()
        WHERE id = current_user_id;
        
        RAISE NOTICE 'Successfully set user % as super admin', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;