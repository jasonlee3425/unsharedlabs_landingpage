-- ============================================================================
-- Enable RLS and Add All Required Policies
-- This is the recommended approach for production
-- ============================================================================

-- ============================================================================
-- Step 1: Enable RLS
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Add policies for companies table
-- ============================================================================

-- INSERT: Allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SELECT: Allow authenticated users to view companies
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: Allow users to update their own company
CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Allow users to delete their own company
CREATE POLICY "Users can delete their own company"
  ON companies FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- Step 3: Add policies for user_profiles table
-- ============================================================================

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Step 4: Verify all policies
-- ============================================================================
SELECT 
    tablename,
    cmd AS operation,
    policyname,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Allows creating'
        WHEN cmd = 'SELECT' THEN '✅ Allows viewing'
        WHEN cmd = 'UPDATE' THEN '✅ Allows updating'
        WHEN cmd = 'DELETE' THEN '✅ Allows deleting'
    END AS description
FROM pg_policies
WHERE tablename IN ('companies', 'user_profiles')
ORDER BY tablename, cmd;
