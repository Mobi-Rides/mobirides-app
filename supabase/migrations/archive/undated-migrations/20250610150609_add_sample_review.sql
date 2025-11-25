-- Add a sample review for the car to test the reviews display
-- This will help us verify if the CarReviews component works correctly

INSERT INTO public.reviews (
  id,
  car_id,
  reviewer_id,
  reviewee_id,
  booking_id,
  rating,
  comment,
  review_type,
  created_at
) VALUES (
  gen_random_uuid(),
  '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8',
  'a2a57a7d-9979-48e8-a078-35742a507e64', -- Current user as reviewer
  (SELECT owner_id FROM public.cars WHERE id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8'), -- Car owner as reviewee
  NULL, -- No specific booking for this test
  5,
  'Excellent car! Very clean and well-maintained. The owner was very responsive and helpful. Highly recommend!',
  'car',
  NOW()
);

-- Add another sample review
INSERT INTO public.reviews (
  id,
  car_id,
  reviewer_id,
  reviewee_id,
  booking_id,
  rating,
  comment,
  review_type,
  created_at
) VALUES (
  gen_random_uuid(),
  '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8',
  'a2a57a7d-9979-48e8-a078-35742a507e64', -- Current user as reviewer
  (SELECT owner_id FROM public.cars WHERE id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8'), -- Car owner as reviewee
  NULL, -- No specific booking for this test
  4,
  'Good car overall. Had a minor issue with the air conditioning but everything else was perfect.',
  'car',
  NOW() - INTERVAL '2 days'
);