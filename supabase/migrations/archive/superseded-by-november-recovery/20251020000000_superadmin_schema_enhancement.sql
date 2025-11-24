-- Create user_restrictions table for superadmin functionality
CREATE TABLE IF NOT EXISTS user_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('suspend', 'ban')),
  reason TEXT NOT NULL,
  restricted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- Only admins can view restrictions
CREATE POLICY "Admins can view all user restrictions" ON user_restrictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert restrictions
CREATE POLICY "Admins can insert user restrictions" ON user_restrictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update restrictions
CREATE POLICY "Admins can update user restrictions" ON user_restrictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for performance
CREATE INDEX idx_user_restrictions_user_id ON user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_is_active ON user_restrictions(is_active);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_restrictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_restrictions_updated_at
  BEFORE UPDATE ON user_restrictions
  FOR EACH ROW EXECUTE FUNCTION update_user_restrictions_updated_at();
