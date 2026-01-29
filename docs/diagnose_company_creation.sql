-- ============================================================================
-- Diagnostic Queries for Company Creation Issues
-- Run these in Supabase SQL Editor to diagnose the problem
-- ============================================================================

-- ============================================================================
-- 1. Check if RLS is enabled
-- ============================================================================
SELECT 
    tablename, 
    rowsecurity AS rls_enabled 
FROM pg_tables 
WHERE tablename IN ('companies', 'user_profiles');

-- ============================================================================
-- 2. List ALL policies on companies table
-- ============================================================================
SELECT
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- ============================================================================
-- 3. List ALL policies on user_profiles table
-- ============================================================================
SELECT
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- ============================================================================
-- 4. Check what operations are missing policies
-- ============================================================================
-- For companies table:
SELECT 
    'companies' AS table_name,
    'INSERT' AS operation,
    CASE 
        WHEN COUNT(*) = 0 THEN 'MISSING - Need INSERT policy'
        ELSE 'EXISTS - ' || string_agg(policyname, ', ')
    END AS status
FROM pg_policies
WHERE tablename = 'companies' AND cmd = 'INSERT'

UNION ALL

SELECT 
    'companies' AS table_name,
    'UPDATE' AS operation,
    CASE 
        WHEN COUNT(*) = 0 THEN 'MISSING - Need UPDATE policy'
        ELSE 'EXISTS - ' || string_agg(policyname, ', ')
    END AS status
FROM pg_policies
WHERE tablename = 'companies' AND cmd = 'UPDATE'

UNION ALL

SELECT 
    'companies' AS table_name,
    'DELETE' AS operation,
    CASE 
        WHEN COUNT(*) = 0 THEN 'MISSING - Need DELETE policy'
        ELSE 'EXISTS - ' || string_agg(policyname, ', ')
    END AS status
FROM pg_policies
WHERE tablename = 'companies' AND cmd = 'DELETE'

UNION ALL

SELECT 
    'user_profiles' AS table_name,
    'UPDATE' AS operation,
    CASE 
        WHEN COUNT(*) = 0 THEN 'MISSING - Need UPDATE policy'
        ELSE 'EXISTS - ' || string_agg(policyname, ', ')
    END AS status
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'UPDATE';

-- ============================================================================
-- 5. Test INSERT as authenticated user (replace with your user ID)
-- ============================================================================
-- First, get your user ID:
-- SELECT id, email FROM auth.users;

-- Then test the insert (replace 'YOUR_USER_ID' with actual UUID):
-- SET request.jwt.claim.sub = 'YOUR_USER_ID';
-- INSERT INTO companies (name) VALUES ('Test Company') RETURNING *;
-- RESET request.jwt.claim.sub;
