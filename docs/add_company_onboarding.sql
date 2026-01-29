-- Company onboarding state
-- Stores onboarding progress per company (selected tech stacks + step completion)

CREATE TABLE IF NOT EXISTS company_onboarding (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION set_company_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_onboarding_set_updated_at ON company_onboarding;
CREATE TRIGGER company_onboarding_set_updated_at
BEFORE UPDATE ON company_onboarding
FOR EACH ROW
EXECUTE FUNCTION set_company_onboarding_updated_at();

-- Enable RLS
ALTER TABLE company_onboarding ENABLE ROW LEVEL SECURITY;

-- Company members can read onboarding
DROP POLICY IF EXISTS "Company members can read onboarding" ON company_onboarding;
CREATE POLICY "Company members can read onboarding"
  ON company_onboarding FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Company members can insert onboarding (first write)
DROP POLICY IF EXISTS "Company members can create onboarding" ON company_onboarding;
CREATE POLICY "Company members can create onboarding"
  ON company_onboarding FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Company members can update onboarding
DROP POLICY IF EXISTS "Company members can update onboarding" ON company_onboarding;
CREATE POLICY "Company members can update onboarding"
  ON company_onboarding FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

