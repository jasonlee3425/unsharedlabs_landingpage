-- ============================================================================
-- Fix Company SELECT Policy for Clients
-- This ensures users with client role can view their own company
-- ============================================================================

-- ============================================================================
-- Step 1: Check current SELECT policies
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
-- Step 2: Drop existing SELECT policies that might be too restrictive
-- ============================================================================
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- ============================================================================
-- Step 3: Add policy that allows users to view companies they belong to
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
-- Step 4: Also add a policy that allows viewing all companies (if needed)
-- ============================================================================
-- Uncomment this if you want all authenticated users to see all companies:
-- CREATE POLICY "Authenticated users can view companies"
--   ON companies FOR SELECT
--   TO authenticated
--   USING (true);

-- ============================================================================
-- Step 5: Verify the policy was created
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'companies'
AND cmd = 'SELECT'
ORDER BY policyname;
