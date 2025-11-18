-- Check what cars exist in the database
SELECT id, brand, model, year, owner_id, location 
FROM public.cars 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the specific car exists
SELECT id, brand, model, year, owner_id, location 
FROM public.cars 
WHERE id = '01936b8e-b8b8-7b8e-b8b8-b8b8b8b8b8b8';