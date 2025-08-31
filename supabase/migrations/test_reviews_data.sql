-- Test query to check if there are any reviews in the database
-- and specifically for the car we're testing

-- Check all reviews in the database
SELECT 
  id,
  car_id,
  reviewer_id,
  rating,
  comment,
  review_type,
  created_at
FROM public.reviews
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for the car we're testing
SELECT 
  id,
  car_id,
  reviewer_id,
  rating,
  comment,
  review_type,
  created_at
FROM public.reviews
WHERE car_id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8'
AND review_type = 'car';

-- Check if the car exists
SELECT id, brand, model, year FROM public.cars WHERE id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8';