-- ============================================================================
-- Disable RLS on Companies and User Profiles Tables
-- WARNING: This disables Row Level Security - use only for development/testing
-- ============================================================================

-- Disable RLS on companies table
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS is still ENABLED'
        ELSE '✅ RLS is DISABLED'
    END AS status
FROM pg_tables
WHERE tablename IN ('companies', 'user_profiles');
