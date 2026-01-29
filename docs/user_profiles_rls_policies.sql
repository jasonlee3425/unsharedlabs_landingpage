-- ============================================================================
-- RLS Policies for user_profiles Table
-- These policies are needed for the company creation flow to work
-- ============================================================================

-- ============================================================================
-- Step 1: Enable RLS on user_profiles (if not already enabled)
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Add policies for user_profiles table
-- ============================================================================

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own profile (during signup)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own profile
-- This is CRITICAL for company creation - allows setting company_id
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Optional: Additional policies for super admins
-- ============================================================================

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

-- ============================================================================
-- Step 3: Verify policies were created
-- ============================================================================
SELECT 
    cmd AS operation,
    policyname,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Allows creating profile'
        WHEN cmd = 'SELECT' THEN '✅ Allows viewing profile'
        WHEN cmd = 'UPDATE' THEN '✅ Allows updating profile (including company_id)'
    END AS description
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd;
