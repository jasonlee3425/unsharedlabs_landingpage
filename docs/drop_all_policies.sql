-- ============================================================================
-- Drop All RLS Policies
-- WARNING: This will remove ALL policies from companies and user_profiles tables
-- Run this if you want to start fresh with policies
-- ============================================================================

-- ============================================================================
-- Drop all policies on companies table
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'companies'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON companies';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- Drop all policies on user_profiles table
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- Verify all policies are dropped
-- ============================================================================
SELECT 
    'companies' AS table_name,
    COUNT(*) AS remaining_policies
FROM pg_policies
WHERE tablename = 'companies'

UNION ALL

SELECT 
    'user_profiles' AS table_name,
    COUNT(*) AS remaining_policies
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ============================================================================
-- Alternative: Manual drop (if you prefer to see exactly what's being dropped)
-- ============================================================================
-- Uncomment and modify these if you want to drop specific policies manually:

-- DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
-- DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
-- DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
-- DROP POLICY IF EXISTS "Users can update their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can delete their own company" ON companies;
-- DROP POLICY IF EXISTS "Users can create companies if they don't have one" ON companies;

-- DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Allow profile creation during signup" ON user_profiles;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
-- DROP POLICY IF EXISTS "Service role can manage profiles" ON user_profiles;
