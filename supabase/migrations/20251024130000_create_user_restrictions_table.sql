-- Create type for restriction types
DO $$ BEGIN
    CREATE TYPE restriction_type_enum AS ENUM ('login_block', 'booking_block', 'messaging_block', 'suspension');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_restrictions table for storing user restriction records
CREATE TABLE public.user_restrictions (
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

-- Enable Row Level Security
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better query performance
CREATE INDEX idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_active ON public.user_restrictions(active);
CREATE INDEX idx_user_restrictions_restriction_type ON public.user_restrictions(restriction_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_restrictions_updated_at
    BEFORE UPDATE ON public.user_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_restrictions_updated_at();