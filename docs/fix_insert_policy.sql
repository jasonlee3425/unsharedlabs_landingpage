-- ============================================================================
-- Fix INSERT Policy for Companies Table
-- This will add/update the INSERT policy to allow authenticated users to create companies
-- ============================================================================

-- ============================================================================
-- Step 1: Check current INSERT policies
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies' 
AND cmd = 'INSERT';

-- ============================================================================
-- Step 2: Drop existing INSERT policies (if any)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies if they don't have one" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Clients can create companies" ON companies;

-- ============================================================================
-- Step 3: Create INSERT policy that allows ALL authenticated users
-- ============================================================================
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Step 4: Verify the policy was created
-- ============================================================================
SELECT 
    'companies' AS table_name,
    cmd AS operation,
    policyname,
    '✅ Policy created' AS status
FROM pg_policies
WHERE tablename = 'companies' 
AND cmd = 'INSERT';

-- ============================================================================
-- Step 5: Also ensure UPDATE and DELETE policies exist (for rollback)
-- ============================================================================

-- UPDATE policy (allows users to update their own company)
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
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

-- DELETE policy (allows users to delete their own company - for rollback)
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;
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
-- Step 6: Verify all policies
-- ============================================================================
SELECT 
    cmd AS operation,
    policyname,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Allows creating companies'
        WHEN cmd = 'UPDATE' THEN '✅ Allows updating company'
        WHEN cmd = 'DELETE' THEN '✅ Allows deleting company'
        WHEN cmd = 'SELECT' THEN '✅ Allows viewing companies'
    END AS description
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd;
