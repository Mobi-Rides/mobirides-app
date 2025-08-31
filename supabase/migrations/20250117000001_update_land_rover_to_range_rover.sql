-- Update Land Rover Lumma to Range Rover Lumma CLR RS
-- This migration updates the specific car record shown in the UI

UPDATE public.cars 
SET 
    brand = 'Range Rover',
    model = 'Lumma CLR RS'
WHERE 
    brand ILIKE '%land rover%' 
    AND model ILIKE '%lumma%'
    AND location ILIKE '%tlokweng%'
    AND price_per_day = 1199.98;

-- Verify the update
SELECT id, brand, model, location, price_per_day 
FROM public.cars 
WHERE brand = 'Range Rover' AND model = 'Lumma CLR RS';