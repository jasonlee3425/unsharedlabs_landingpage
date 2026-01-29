-- ============================================================================
-- Verify Company SELECT Policy
-- Run this to check if users can view their own company
-- ============================================================================

-- Check SELECT policies on companies table
SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
AND cmd = 'SELECT'
ORDER BY policyname;

-- If you see policies that check company_id in user_profiles, that should work
-- But if you only see policies that require super_admin, that's the problem

-- Quick fix: Add a policy that allows users to view companies they belong to
-- (This should already exist, but let's verify)

-- If missing, run this:
-- CREATE POLICY "Users can view their own company"
--   ON companies FOR SELECT
--   TO authenticated
--   USING (
--     id IN (
--       SELECT company_id FROM user_profiles
--       WHERE user_id = auth.uid()
--       AND company_id IS NOT NULL
--     )
--   );
