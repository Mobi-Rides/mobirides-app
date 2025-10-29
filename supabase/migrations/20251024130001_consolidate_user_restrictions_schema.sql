-- Migration to consolidate user_restrictions schema conflicts
-- This migration handles the transition from the old schema to the comprehensive new schema

-- Step 1: Handle existing data migration if old schema exists
DO $$ 
DECLARE
    old_table_exists boolean;
    old_data_count integer;
BEGIN
    -- Check if old table structure exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_restrictions' 
        AND table_schema = 'public'
    ) INTO old_table_exists;

    IF old_table_exists THEN
        -- Check if it has the old 'is_active' column (indicates old schema)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_restrictions' 
            AND column_name = 'is_active'
        ) THEN
            RAISE NOTICE 'Found old user_restrictions schema, migrating data...';
            
            -- Count existing data
            SELECT COUNT(*) INTO old_data_count FROM user_restrictions;
            RAISE NOTICE 'Found % records to migrate', old_data_count;
            
            -- Create temporary table to hold migrated data
            CREATE TEMP TABLE temp_user_restrictions_migrated AS
            SELECT 
                id,
                user_id, 
                CASE restriction_type 
                    WHEN 'suspend' THEN 'suspension'::restriction_type_enum
                    WHEN 'ban' THEN 'login_block'::restriction_type_enum
                    ELSE 'login_block'::restriction_type_enum
                END AS restriction_type,
                reason,
                is_active AS active,
                restricted_at AS starts_at,
                expires_at AS ends_at,
                created_by,
                restricted_at AS created_at,
                NOW() AS updated_at
            FROM user_restrictions;
            
            -- Drop old table
            DROP TABLE user_restrictions;
            
            RAISE NOTICE 'Old table dropped, creating new schema...';
        END IF;
    END IF;
END $$;

-- Step 2: Ensure the comprehensive schema exists (in case it was dropped)
-- Create type for restriction types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE restriction_type_enum AS ENUM ('login_block', 'booking_block', 'messaging_block', 'suspension');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the comprehensive user_restrictions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_restrictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restriction_type restriction_type_enum NOT NULL,
    reason text,
    active boolean NOT NULL DEFAULT true,
    starts_at timestamptz DEFAULT now(),
    ends_at timestamptz,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 3: Restore migrated data if we had any
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_user_restrictions_migrated') THEN
        RAISE NOTICE 'Restoring migrated data...';
        
        INSERT INTO public.user_restrictions (
            id, user_id, restriction_type, reason, active, starts_at, ends_at, created_by, created_at, updated_at
        )
        SELECT id, user_id, restriction_type, reason, active, starts_at, ends_at, created_by, created_at, updated_at
        FROM temp_user_restrictions_migrated;
        
        -- Clean up temp table
        DROP TABLE temp_user_restrictions_migrated;
        
        RAISE NOTICE 'Data migration completed successfully';
    END IF;
END $$;

-- Step 4: Ensure proper RLS policies (drop old ones first to avoid conflicts)
DO $$
BEGIN
    -- Drop any existing policies on user_restrictions
    DROP POLICY IF EXISTS "Admins can view all user restrictions" ON public.user_restrictions;
    DROP POLICY IF EXISTS "Admins can insert user restrictions" ON public.user_restrictions;
    DROP POLICY IF EXISTS "Admins can update user restrictions" ON public.user_restrictions;
    DROP POLICY IF EXISTS "Admins and super admins can view all restrictions" ON public.user_restrictions;
    DROP POLICY IF EXISTS "Admins and super admins can create restrictions" ON public.user_restrictions;
    DROP POLICY IF EXISTS "Admins and super admins can update restrictions" ON public.user_restrictions;
END $$;

-- Step 5: Create comprehensive RLS policies
-- Grant access to authenticated users (policies will restrict actual access)
GRANT ALL ON public.user_restrictions TO authenticated;

-- Create RLS policies for user_restrictions table
CREATE POLICY "Admins and super admins can view all restrictions" ON public.user_restrictions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.id = auth.uid() AND a.is_super_admin = true
        )
    );

CREATE POLICY "Admins and super admins can create restrictions" ON public.user_restrictions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.id = auth.uid() AND a.is_super_admin = true
        )
    );

CREATE POLICY "Admins and super admins can update restrictions" ON public.user_restrictions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.id = auth.uid() AND a.is_super_admin = true
        )
    );

-- Step 6: Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON public.user_restrictions(active);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_restriction_type ON public.user_restrictions(restriction_type);

-- Step 7: Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.handle_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_restrictions_updated_at ON public.user_restrictions;

CREATE TRIGGER handle_user_restrictions_updated_at
    BEFORE UPDATE ON public.user_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_restrictions_updated_at();

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'User restrictions schema consolidation completed successfully';
    RAISE NOTICE 'Table structure: % columns', (
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'user_restrictions' AND table_schema = 'public'
    );
END $$;