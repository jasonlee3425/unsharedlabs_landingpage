-- ============================================================================
-- Simple Script to Drop All Policies (Manual List)
-- Copy and paste this into Supabase SQL Editor
-- ============================================================================

-- Drop all companies table policies
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Clients can view their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can delete their own company" ON companies;
DROP POLICY IF EXISTS "Users can create companies if they don't have one" ON companies;

-- Drop all user_profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON user_profiles;

-- Verify policies are dropped
SELECT 
    tablename,
    COUNT(*) AS remaining_policies
FROM pg_policies
WHERE tablename IN ('companies', 'user_profiles')
GROUP BY tablename;
