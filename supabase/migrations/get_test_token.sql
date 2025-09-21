-- Query to get the confirmation token for testing
SELECT token, email, full_name, expires_at 
FROM pending_confirmations 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC 
LIMIT 1