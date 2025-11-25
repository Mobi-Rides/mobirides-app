-- Canonical creation of public.reviews table
-- Based on remote schema inspection
-- Timestamp: BEFORE 20250131000001_add_reviews_insert_policy_only.sql

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating numeric(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  review_type public.review_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  review_images text[] DEFAULT '{}'::text[],
  category_ratings jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'published'::text,
  response text,
  response_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_car_id ON public.reviews(car_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_review_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Basic policies (detailed policies added by later migrations)
CREATE POLICY "Users can view published reviews"
  ON public.reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());