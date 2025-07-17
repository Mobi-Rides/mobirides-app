
-- Create user_verifications table
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'personal_info',
  overall_status TEXT NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Step completion flags
  personal_info_completed BOOLEAN DEFAULT false,
  documents_completed BOOLEAN DEFAULT false,
  selfie_completed BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  address_confirmed BOOLEAN DEFAULT false,
  
  -- Data storage
  personal_info JSONB DEFAULT '{}',
  user_role TEXT NOT NULL DEFAULT 'renter',
  
  -- Admin fields
  admin_notes TEXT,
  rejection_reasons TEXT[]
);

-- Add Row Level Security
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification data
CREATE POLICY "Users can view own verification" ON public.user_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verification data
CREATE POLICY "Users can insert own verification" ON public.user_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification data
CREATE POLICY "Users can update own verification" ON public.user_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update last_updated_at
CREATE OR REPLACE FUNCTION update_user_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_verifications_timestamp 
    BEFORE UPDATE ON public.user_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_user_verification_timestamp();
