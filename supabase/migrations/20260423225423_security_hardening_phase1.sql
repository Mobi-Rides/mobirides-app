-- Phase 1: Security Hardening (MOB-23)
-- Created user_roles table, secured is_admin functions, and hardened profiles.

-- 1. Infrastructure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_roles_user' AND conrelid = 'public.user_roles'::regclass) THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT uq_user_roles_user;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key' AND conrelid = 'public.user_roles'::regclass) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Data Migration
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins' AND table_schema = 'public') THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT id, CASE WHEN is_super_admin THEN 'super_admin'::public.user_role ELSE 'admin'::public.user_role END
        FROM public.admins
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- 3. Functions (Preserve signatures exactly)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'super_admin'
  );
END;
$$;

-- 4. Triggers
CREATE OR REPLACE FUNCTION public.handle_user_role_sync()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET role = (
    SELECT role
    FROM public.user_roles
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ORDER BY 
      CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'host' THEN 3
        WHEN 'renter' THEN 4
      END ASC
    LIMIT 1
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_sync();

-- 5. Profile Policy Update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR 
    public.is_admin(auth.uid())
  );
