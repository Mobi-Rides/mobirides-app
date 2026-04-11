
-- Tutorial progress tracking (hybrid approach: steps are hardcoded in frontend)
CREATE TABLE public.user_tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_key)
);

-- Profile extensions for tutorial state
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tutorial_dismissed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tutorial_version INTEGER DEFAULT 1;

-- RLS
ALTER TABLE public.user_tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tutorial progress"
  ON public.user_tutorial_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress"
  ON public.user_tutorial_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tutorial progress"
  ON public.user_tutorial_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
