-- Tables created by this migration:
--   1. platform_settings   -- key/value store for global platform parameters
--   2. dynamic_pricing_rules -- replaces hardcoded pricing rules in dynamicPricingService.ts
--
-- Consumers (after wiring): 
--   src/services/dynamicPricingService.ts
--   src/services/commission/commissionRates.ts
--   src/services/insuranceService.ts
--   src/pages/Admin/AdminSettings.tsx
--   src/hooks/usePlatformSettings.ts
--
-- Impact: Additive only -- new tables + seed data. No existing schema changes.
-- Rollback: DROP TABLE IF EXISTS platform_settings; DROP TABLE IF EXISTS dynamic_pricing_rules;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dynamic_pricing_rules table
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    multiplier NUMERIC(4,2) NOT NULL,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_settings
CREATE POLICY "platform_settings_read_all_authenticated" ON platform_settings
    FOR SELECT TO authenticated USING (true);

-- Assuming is_admin() function exists as per the project standards
CREATE POLICY "platform_settings_write_super_admin" ON platform_settings
    FOR ALL TO authenticated USING (is_admin());

-- RLS Policies for dynamic_pricing_rules
CREATE POLICY "dynamic_pricing_rules_read_all_authenticated" ON dynamic_pricing_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "dynamic_pricing_rules_write_super_admin" ON dynamic_pricing_rules
    FOR ALL TO authenticated USING (is_admin());

-- Create RPC get_platform_settings 
CREATE OR REPLACE FUNCTION get_platform_settings()
RETURNS SETOF platform_settings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM platform_settings;
$$;

-- Create RPC update_platform_setting
CREATE OR REPLACE FUNCTION update_platform_setting(p_key TEXT, p_value JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE platform_settings
    SET setting_value = p_value,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE setting_key = p_key;
END;
$$;

-- Seed data for platform_settings
INSERT INTO platform_settings (setting_key, setting_value, category, description) VALUES
('commission_rate_default', '0.15'::jsonb, 'commission', 'Default commission rate fallback'),
('dynamic_pricing_enabled', 'true'::jsonb, 'pricing', 'Global toggle for dynamic pricing'),
('insurance_admin_fee_pula', '150'::jsonb, 'insurance', 'Admin fee charged per insurance claim in Pula'),
('loyalty_tier_silver_threshold', '5'::jsonb, 'pricing', 'Number of trips required for Silver loyalty tier'),
('loyalty_tier_gold_threshold', '10'::jsonb, 'pricing', 'Number of trips required for Gold loyalty tier'),
('loyalty_tier_platinum_threshold', '20'::jsonb, 'pricing', 'Number of trips required for Platinum loyalty tier')
ON CONFLICT (setting_key) DO NOTHING;

-- Seed data for dynamic_pricing_rules
INSERT INTO dynamic_pricing_rules (id, name, type, is_active, multiplier, priority, conditions) VALUES
('weekend-premium', 'Weekend Premium', 'WEEKEND', true, 1.20, 100, '{"days_of_week": [0, 6]}'::jsonb),
('summer-premium', 'Summer Season Premium', 'SEASONAL', true, 1.15, 90, '{"seasons": ["summer"]}'::jsonb),
('early-bird-discount', 'Early Bird Discount', 'EARLY_BIRD', true, 0.90, 80, '{"advance_booking_days": 7}'::jsonb),
('high-demand-premium', 'High Demand Premium', 'DEMAND', true, 1.30, 110, '{"demand_threshold": 80}'::jsonb),
('loyalty-gold-discount', 'Loyalty Gold Discount', 'LOYALTY', true, 0.95, 70, '{"user_tier": "gold"}'::jsonb),
('loyalty-platinum-discount', 'Loyalty Platinum Discount', 'LOYALTY', true, 0.90, 75, '{"user_tier": "platinum"}'::jsonb),
('destination-out-of-zone', 'Out of Zone Premium', 'DESTINATION', true, 1.50, 105, '{"destination_type": "out_of_zone"}'::jsonb),
('destination-cross-border', 'Cross-Border Premium', 'DESTINATION', true, 2.00, 105, '{"destination_type": "cross_border"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
