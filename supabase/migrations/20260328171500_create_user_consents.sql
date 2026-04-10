-- S9-011 / MOB-614: Create user_consents table (GDPR compliance audit trail)

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted boolean NOT NULL DEFAULT false,
  community_accepted boolean NOT NULL DEFAULT false,
  age_confirmed boolean NOT NULL DEFAULT false,
  marketing_opted_in boolean NOT NULL DEFAULT false,
  consent_version text NOT NULL DEFAULT '1.0',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- User can insert their own consent record
CREATE POLICY "Users can insert own consent"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can read their own consent record
CREATE POLICY "Users can read own consent"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all consent records
CREATE POLICY "Admins can read all consents"
  ON public.user_consents FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
