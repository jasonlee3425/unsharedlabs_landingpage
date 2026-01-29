-- ============================================================================
-- Add Company Data Tables
-- Stores current company dashboard data and historical versions
-- ============================================================================

-- ============================================================================
-- 1. Create company_data table (stores current/latest data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id) -- One current data record per company
);

-- ============================================================================
-- 2. Create company_data_history table (stores all historical versions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_data_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Store reference to the company_data record this history entry came from
  company_data_id UUID REFERENCES company_data(id) ON DELETE SET NULL
);

-- ============================================================================
-- 3. Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_company_data_company_id ON company_data(company_id);
CREATE INDEX IF NOT EXISTS idx_company_data_history_company_id ON company_data_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_data_history_version ON company_data_history(company_id, version);
CREATE INDEX IF NOT EXISTS idx_company_data_history_created_at ON company_data_history(company_id, created_at DESC);

-- GIN index for JSONB queries (allows efficient querying of JSON data)
CREATE INDEX IF NOT EXISTS idx_company_data_data_gin ON company_data USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_company_data_history_data_gin ON company_data_history USING GIN (data);

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE company_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_data_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies for company_data table
-- ============================================================================

-- Users can view data for their own company
CREATE POLICY "Users can view data for their company"
  ON company_data FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Super admins can view all company data
CREATE POLICY "Super admins can view all company data"
  ON company_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Service role can insert/update (for external system updates)
-- Note: External system will use service role key to update data
CREATE POLICY "Service role can manage company data"
  ON company_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. RLS Policies for company_data_history table
-- ============================================================================

-- Users can view history for their own company
CREATE POLICY "Users can view history for their company"
  ON company_data_history FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Super admins can view all history
CREATE POLICY "Super admins can view all history"
  ON company_data_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Service role can insert history (for external system updates)
CREATE POLICY "Service role can insert history"
  ON company_data_history FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 7. Function to automatically save to history when company_data is updated
-- ============================================================================
CREATE OR REPLACE FUNCTION save_company_data_to_history()
RETURNS TRIGGER AS $$
BEGIN
  -- When company_data is updated, save the old version to history
  IF TG_OP = 'UPDATE' AND OLD.data IS DISTINCT FROM NEW.data THEN
    INSERT INTO company_data_history (
      company_id,
      data,
      version,
      company_data_id
    ) VALUES (
      OLD.company_id,
      OLD.data,
      OLD.version,
      OLD.id
    );
    
    -- Increment version for new data
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
  ELSIF TG_OP = 'INSERT' THEN
    -- For new inserts, version starts at 1
    NEW.version := 1;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Create trigger to automatically save history on updates
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_save_company_data_history ON company_data;
CREATE TRIGGER trigger_save_company_data_history
  BEFORE UPDATE OR INSERT ON company_data
  FOR EACH ROW
  EXECUTE FUNCTION save_company_data_to_history();

-- ============================================================================
-- 9. Add comments for documentation
-- ============================================================================
COMMENT ON TABLE company_data IS 'Stores the current/latest dashboard data for each company. Updated by external system.';
COMMENT ON TABLE company_data_history IS 'Stores historical versions of company dashboard data for audit and rollback purposes.';
COMMENT ON COLUMN company_data.data IS 'JSONB field containing the dashboard data structure from external system.';
COMMENT ON COLUMN company_data.version IS 'Incremental version number for tracking data updates.';
COMMENT ON COLUMN company_data_history.data IS 'JSONB field containing the historical snapshot of dashboard data.';
COMMENT ON COLUMN company_data_history.version IS 'Version number of this historical snapshot.';
