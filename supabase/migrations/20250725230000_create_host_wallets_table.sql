-- Create host_wallets table
CREATE TABLE IF NOT EXISTS public.host_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'BWP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_host_wallet UNIQUE (host_id),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Enable RLS
ALTER TABLE public.host_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.host_wallets;
CREATE POLICY "Users can view their own wallet"
    ON public.host_wallets
    FOR SELECT
    USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON public.host_wallets;
CREATE POLICY "Users can update their own wallet"
    ON public.host_wallets
    FOR UPDATE
    USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Service role can manage all wallets" ON public.host_wallets;
CREATE POLICY "Service role can manage all wallets"
    ON public.host_wallets
    FOR ALL
    USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_host_wallets_host_id ON public.host_wallets(host_id);
CREATE INDEX IF NOT EXISTS idx_host_wallets_balance ON public.host_wallets(balance);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_host_wallets_updated_at ON public.host_wallets;
CREATE TRIGGER update_host_wallets_updated_at
    BEFORE UPDATE ON public.host_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
