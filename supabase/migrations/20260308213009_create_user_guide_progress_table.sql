
-- MOB-304: Create user_guide_progress table
-- Dependencies: public.guides table
-- Consumers: useGuideProgress hook (MOB-305), HelpSection.tsx (MOB-306)

CREATE TABLE public.user_guide_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  completed_steps JSONB DEFAULT '[]'::jsonb NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, guide_id)
);

-- Enable RLS
ALTER TABLE public.user_guide_progress ENABLE ROW LEVEL SECURITY;

-- Users can only read their own progress
CREATE POLICY "Users can read own progress"
  ON public.user_guide_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.user_guide_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON public.user_guide_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_guide_progress_updated_at
  BEFORE UPDATE ON public.user_guide_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
