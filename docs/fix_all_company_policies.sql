-- ============================================================================
-- Complete Fix for Company Creation - All Required RLS Policies
-- Run this in Supabase SQL Editor to fix company creation issues
-- ============================================================================

-- ============================================================================
-- 1. Drop existing INSERT policy if it exists (to avoid conflicts)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies if they don't have one" ON companies;

-- ============================================================================
-- 2. Add INSERT policy for companies table
-- ============================================================================
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 3. Add UPDATE policy for companies table (in case it's needed)
-- ============================================================================
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

-- ============================================================================
-- 4. Ensure user_profiles UPDATE policy allows updating company_id
-- ============================================================================
-- Check if the policy exists, if not create it
-- The existing policy should work, but let's make sure it's correct
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. Verify all policies are in place
-- ============================================================================
-- Run this query to see all policies on companies table:
SELECT
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

-- Run this query to see all policies on user_profiles table:
SELECT
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
