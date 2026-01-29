-- ============================================================================
-- Complete Fix for Company RLS Policies
-- This script will drop ALL existing policies and recreate them correctly
-- Run this if you're still getting RLS errors
-- ============================================================================

-- ============================================================================
-- Step 1: Check current state
-- ============================================================================
SELECT 'Current policies on companies:' AS info;
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- Step 2: Drop ALL existing policies on companies table
-- ============================================================================
SELECT 'Dropping all existing policies...' AS info;

DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Super admins can create companies" ON companies;
DROP POLICY IF EXISTS "Clients can create companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;

-- ============================================================================
-- Step 3: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: Create INSERT policy (MOST IMPORTANT - allows company creation)
-- ============================================================================
SELECT 'Creating INSERT policy...' AS info;

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Step 5: Create SELECT policies (allows viewing companies)
-- ============================================================================
SELECT 'Creating SELECT policies...' AS info;

-- Allow users to view companies they belong to
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

-- Also allow viewing all companies (for debugging - you can remove this later)
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Step 6: Create UPDATE policy (allows updating company info)
-- ============================================================================
SELECT 'Creating UPDATE policy...' AS info;

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- ============================================================================
-- Step 7: Create DELETE policy (allows deleting company)
-- ============================================================================
SELECT 'Creating DELETE policy...' AS info;

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
-- Step 8: Verify all policies were created
-- ============================================================================
SELECT 'Verifying policies...' AS info;
SELECT 
    policyname,
    cmd AS command,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check
        ELSE qual
    END AS policy_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- Step 9: Check user_profiles policies (needed for company lookup)
-- ============================================================================
SELECT 'Checking user_profiles policies...' AS info;
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Make sure users can view their own profile (needed for company lookup)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- Step 10: Test the policies
-- ============================================================================
SELECT 'Policies created successfully!' AS info;
SELECT 'You should now be able to create companies.' AS info;
SELECT 'Try creating a company again in your application.' AS info;
