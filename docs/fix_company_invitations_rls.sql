-- ============================================================================
-- Fix RLS Policy for Company Invitations
-- Allow users to view invitations sent to their email address
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view invitations for their company" ON company_invitations;

-- Create a new policy that allows users to view invitations sent to their email
-- This works for users both with and without a company
CREATE POLICY "Users can view invitations for their company"
  ON company_invitations FOR SELECT
  TO authenticated
  USING (
    -- Users can view invitations for their company (if they have one)
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
    OR
    -- Users can view invitations sent to their email address (even if they don't have a company yet)
    email = (
      SELECT email FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Keep the other policies as they are
-- The "Anyone can view invitation by token" policy already exists for anonymous access
