-- Fix existing cars that are live without admin approval
-- These cars have verification_status='pending' but is_available=true
UPDATE cars SET is_available = false WHERE verification_status = 'pending' AND is_available = true;