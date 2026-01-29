-- ============================================================================
-- Diagnose Company INSERT Policy Issue
-- Run this to check what's preventing company creation
-- ============================================================================

-- ============================================================================
-- Step 1: Check if RLS is enabled
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'companies';

-- ============================================================================
-- Step 2: List ALL policies on companies table (not just INSERT)
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression,
    roles
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- Step 3: Check if there are any conflicting policies
-- ============================================================================
-- If you see multiple INSERT policies, they might be conflicting
-- PostgreSQL uses OR logic for multiple policies, so if ANY policy allows it, it should work
-- But let's make sure we have at least one that works

-- ============================================================================
-- Step 4: Drop ALL existing policies on companies table (be careful!)
-- ============================================================================
-- Uncomment these if you want to start fresh:
-- DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
-- DROP POLICY IF EXISTS "Super admins can create companies" ON companies;
-- DROP POLICY IF EXISTS "Clients can create companies" ON companies;
-- DROP POLICY IF EXISTS "Users can create companies" ON companies;
-- DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
-- DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
-- DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
-- DROP POLICY IF EXISTS "Users can view their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can update their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can delete their own company" ON companies;

-- ============================================================================
-- Step 5: Create a simple, permissive INSERT policy
-- ============================================================================
-- First, let's make sure the policy exists and is correct
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Step 6: Also ensure SELECT policy exists (needed to read back the created company)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;

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

-- Also allow viewing all companies (for now, to debug)
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Step 7: Verify policies were created
-- ============================================================================
SELECT 
    policyname,
    cmd AS command,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- Step 8: Test if you can manually insert (replace YOUR_USER_ID with actual UUID)
-- ============================================================================
-- This will help determine if it's a policy issue or an auth issue
-- Uncomment and replace YOUR_USER_ID:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID';
-- INSERT INTO companies (name) VALUES ('Test Company') RETURNING *;
