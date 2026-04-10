
-- Fix transaction_type length to accommodate 'rental_earnings_pending' (23 chars)
ALTER TABLE wallet_transactions ALTER COLUMN transaction_type TYPE VARCHAR(50);
