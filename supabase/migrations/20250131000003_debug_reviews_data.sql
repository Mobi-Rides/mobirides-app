-- Debug migration to check reviews data and RLS policies

-- First, let's see what reviews exist in the database
SELECT 
    r.id,
    r.reviewer_id,
    r.reviewee_id,
    r.car_id,
    r.booking_id,
    r.rating,
    r.comment,
    r.review_type,
    r.status,
    r.created_at,
    p.full_name as reviewer_name
FROM reviews r
LEFT JOIN profiles p ON r.reviewer_id = p.id
ORDER BY r.created_at DESC;

-- Check what cars have reviews
SELECT 
    c.id as car_id,
    c.brand,
    c.model,
    COUNT(r.id) as review_count
FROM cars c
LEFT JOIN reviews r ON c.id = r.car_id AND r.review_type = 'car'
GROUP BY c.id, c.brand, c.model
HAVING COUNT(r.id) > 0
ORDER BY review_count DESC;

-- Check current RLS policies on reviews table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reviews';