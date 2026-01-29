-- ============================================================================
-- Fix Infinite Recursion in user_profiles RLS Policy
-- The "Super admins can view all profiles" policy causes recursion
-- ============================================================================

-- ============================================================================
-- Step 1: Drop the problematic policy
-- ============================================================================
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;

-- ============================================================================
-- Step 2: Alternative approach - Use a security definer function
-- ============================================================================
-- Create a function that bypasses RLS to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = is_super_admin.user_id
    AND user_profiles.role = 'super_admin'
  );
END;
$$;

-- ============================================================================
-- Step 3: Recreate the policy using the function (if you need super admin access)
-- ============================================================================
-- Uncomment this if you need super admins to view all profiles:
-- CREATE POLICY "Super admins can view all profiles"
--   ON user_profiles FOR SELECT
--   USING (is_super_admin(auth.uid()));

-- ============================================================================
-- Step 4: Verify policies (should not have recursion)
-- ============================================================================
SELECT 
    tablename,
    cmd AS operation,
    policyname,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;
