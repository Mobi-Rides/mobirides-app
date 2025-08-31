-- Check if there are any reviews in the database
SELECT 
  r.id,
  r.car_id,
  r.reviewer_id,
  r.rating,
  r.comment,
  r.created_at,
  p.full_name as reviewer_name
FROM reviews r
LEFT JOIN profiles p ON r.reviewer_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Check specifically for the car we're testing
SELECT 
  r.id,
  r.car_id,
  r.reviewer_id,
  r.rating,
  r.comment,
  r.created_at,
  p.full_name as reviewer_name
FROM reviews r
LEFT JOIN profiles p ON r.reviewer_id = p.id
WHERE r.car_id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8'
ORDER BY r.created_at DESC;

-- Check if the car exists
SELECT id, brand, model, owner_id 
FROM cars 
WHERE id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8';