-- Update wallet_transactions transaction_type constraint to include 'insurance_payout'
ALTER TABLE public.wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_transaction_type_check 
CHECK (transaction_type IN ('credit', 'debit', 'commission', 'refund', 'withdrawal', 'insurance_payout'));

-- Add a comment to the table to document the change
COMMENT ON COLUMN public.wallet_transactions.transaction_type IS 'Type of transaction: credit, debit, commission, refund, withdrawal, or insurance_payout';
