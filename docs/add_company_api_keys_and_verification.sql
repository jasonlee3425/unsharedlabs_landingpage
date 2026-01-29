-- ============================================================================
-- Add Company API Keys and Account Verification Tables
-- ============================================================================

-- ============================================================================
-- 1. Create company_api_keys table
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id) -- Only one API key per company
);

-- ============================================================================
-- 2. Create company_verification_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_verification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_id TEXT, -- ID returned from email service
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id) -- Only one verification setting per company
);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE company_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_verification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policies for company_api_keys
-- ============================================================================

-- Clients can view their own company's API key
CREATE POLICY "Clients can view their own company API key"
  ON company_api_keys FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Super admins can view all API keys
CREATE POLICY "Super admins can view all API keys"
  ON company_api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Clients can insert/update their own company's API key (only admins)
CREATE POLICY "Company admins can manage their API key"
  ON company_api_keys FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_role = 'admin'
    )
  );

-- ============================================================================
-- 5. RLS Policies for company_verification_settings
-- ============================================================================

-- Clients can view their own company's verification settings
CREATE POLICY "Clients can view their own verification settings"
  ON company_verification_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Super admins can view all verification settings
CREATE POLICY "Super admins can view all verification settings"
  ON company_verification_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Clients can insert/update their own company's verification settings (only admins)
CREATE POLICY "Company admins can manage their verification settings"
  ON company_verification_settings FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_role = 'admin'
    )
  );

-- ============================================================================
-- 6. Create indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_company_api_keys_company_id ON company_api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_company_verification_settings_company_id ON company_verification_settings(company_id);

-- ============================================================================
-- 7. Add updated_at trigger function (if not exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Create triggers for updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_company_api_keys_updated_at ON company_api_keys;
CREATE TRIGGER update_company_api_keys_updated_at
  BEFORE UPDATE ON company_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_verification_settings_updated_at ON company_verification_settings;
CREATE TRIGGER update_company_verification_settings_updated_at
  BEFORE UPDATE ON company_verification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
