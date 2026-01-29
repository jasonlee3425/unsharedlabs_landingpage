-- ============================================================================
-- Check RLS Status and Fix Options
-- ============================================================================

-- ============================================================================
-- Step 1: Check if RLS is enabled
-- ============================================================================
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS is ENABLED - blocks all operations without policies'
        ELSE '✅ RLS is DISABLED - allows all operations'
    END AS status
FROM pg_tables
WHERE tablename IN ('companies', 'user_profiles');

-- ============================================================================
-- Step 2: Check how many policies exist
-- ============================================================================
SELECT 
    tablename,
    COUNT(*) AS policy_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ NO POLICIES - RLS will block everything'
        ELSE '✅ Has ' || COUNT(*) || ' policies'
    END AS status
FROM pg_policies
WHERE tablename IN ('companies', 'user_profiles')
GROUP BY tablename;

-- ============================================================================
-- OPTION 1: Disable RLS (Quick fix, but less secure)
-- ============================================================================
-- Uncomment these lines if you want to disable RLS entirely:

-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: Add INSERT policy (Recommended - keeps RLS enabled)
-- ============================================================================
-- Run this to add the INSERT policy:

CREATE POLICY IF NOT EXISTS "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also add SELECT policy so users can see companies:
CREATE POLICY IF NOT EXISTS "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Add UPDATE policy:
CREATE POLICY IF NOT EXISTS "Users can update their own company"
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

-- Add DELETE policy:
CREATE POLICY IF NOT EXISTS "Users can delete their own company"
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
-- Step 3: Verify policies were added
-- ============================================================================
SELECT 
    tablename,
    cmd AS operation,
    policyname
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd;
