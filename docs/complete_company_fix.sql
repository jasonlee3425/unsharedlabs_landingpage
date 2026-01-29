-- ============================================================================
-- COMPLETE FIX for Company Creation
-- Run this entire script in Supabase SQL Editor
-- This will add all necessary policies for company creation
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove any conflicting policies (if they exist)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies if they don't have one" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;

-- ============================================================================
-- STEP 2: Add INSERT policy for companies (allows creating companies)
-- This allows ALL authenticated users (both super_admin and client roles) to create companies
-- ============================================================================
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternative: If you want to prevent users who already have a company from creating another one,
-- uncomment this policy instead and comment out the one above:
-- CREATE POLICY "Users can create companies if they don't have one"
--   ON companies FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     NOT EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_id = auth.uid()
--       AND company_id IS NOT NULL
--     )
--   );

-- ============================================================================
-- STEP 3: Add UPDATE policy for companies (allows updating company info)
-- ============================================================================
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

-- ============================================================================
-- STEP 4: Add DELETE policy for companies (needed for cleanup if profile update fails)
-- ============================================================================
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
-- STEP 5: Ensure user_profiles UPDATE policy exists and is correct
-- ============================================================================
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 6: Verify all policies are created
-- ============================================================================
SELECT 
    'companies' AS table_name,
    cmd AS operation,
    policyname,
    CASE WHEN cmd = 'INSERT' THEN '✅ Allows creating companies'
         WHEN cmd = 'UPDATE' THEN '✅ Allows updating company info'
         WHEN cmd = 'DELETE' THEN '✅ Allows deleting company (cleanup)'
         WHEN cmd = 'SELECT' THEN '✅ Allows viewing companies'
         ELSE cmd
    END AS description
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd;

SELECT 
    'user_profiles' AS table_name,
    cmd AS operation,
    policyname,
    CASE WHEN cmd = 'UPDATE' THEN '✅ Allows updating profile (including company_id)'
         WHEN cmd = 'INSERT' THEN '✅ Allows creating profile'
         WHEN cmd = 'SELECT' THEN '✅ Allows viewing profile'
         ELSE cmd
    END AS description
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd IN ('UPDATE', 'INSERT', 'SELECT')
ORDER BY cmd;

-- ============================================================================
-- DONE! Try creating a company again
-- ============================================================================
