-- ============================================================================
-- Fix Company INSERT Policy
-- This ensures authenticated users (both super_admin and client roles) can create companies
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
AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- Step 2: Drop existing INSERT policies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Super admins can create companies" ON companies;
DROP POLICY IF EXISTS "Clients can create companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;

-- ============================================================================
-- Step 3: Add policy that allows ALL authenticated users to create companies
-- This allows both super_admin and client roles to create companies
-- ============================================================================
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Step 4: Verify the policy was created
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- Note: The WITH CHECK (true) means any authenticated user can insert any company.
-- If you want to restrict this further (e.g., only allow clients to create companies),
-- you could use:
-- 
-- CREATE POLICY "Clients can create companies"
--   ON companies FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_id = auth.uid()
--       AND role = 'client'
--     )
--   );
-- 
-- But for now, allowing all authenticated users is simpler and matches your requirement.
