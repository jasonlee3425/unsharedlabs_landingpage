-- ============================================================================
-- Add INSERT Policy for Companies Table
-- This allows authenticated users to create companies
-- ============================================================================
-- Run this in Supabase SQL Editor to allow users to create companies
-- ============================================================================

-- Allow authenticated users to insert companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternative: More restrictive policy that only allows users without a company
-- Uncomment this if you want to prevent users who already have a company from creating another one
-- CREATE POLICY "Users can create companies if they don't have one"
--   ON companies FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     NOT EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_id = auth.uid()
--       AND company_id IS NOT NULL
--     )
--   );
