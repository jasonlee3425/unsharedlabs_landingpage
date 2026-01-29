-- ============================================================================
-- Check and Fix Company SELECT Policy
-- This script checks current policies and ensures clients can view their company
-- ============================================================================

-- ============================================================================
-- Step 1: Check current SELECT policies on companies table
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- Step 2: Check if RLS is enabled
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'companies';

-- ============================================================================
-- Step 3: Check user_profiles table policies (needed for company lookup)
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- Step 4: Drop existing SELECT policies that might be too restrictive
-- ============================================================================
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- ============================================================================
-- Step 5: Add policy that allows users to view companies they belong to
-- This is the most permissive policy that still maintains security
-- ============================================================================
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- Step 6: Also add policy for super admins (if you need it)
-- ============================================================================
CREATE POLICY "Super admins can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ============================================================================
-- Step 7: Verify user_profiles SELECT policy allows users to see their own profile
-- ============================================================================
-- Check if policy exists
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname = 'Users can view their own profile';

-- If it doesn't exist, create it:
-- CREATE POLICY "Users can view their own profile"
--   ON user_profiles FOR SELECT
--   USING (user_id = auth.uid());

-- ============================================================================
-- Step 8: Verify the policies were created correctly
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'companies'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- Step 9: Test query (run this as your authenticated user)
-- ============================================================================
-- This should return your company if you have one:
-- SELECT c.* 
-- FROM companies c
-- WHERE c.id IN (
--   SELECT company_id FROM user_profiles
--   WHERE user_id = auth.uid()
--   AND company_id IS NOT NULL
-- );
