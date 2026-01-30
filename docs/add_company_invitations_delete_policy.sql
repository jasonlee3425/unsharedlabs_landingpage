-- ============================================================================
-- Add DELETE Policy for Company Invitations
-- Allows company admins to delete (cancel) pending invitations
-- ============================================================================

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Company admins can delete invitations for their company" ON company_invitations;

-- Create DELETE policy for company admins
-- Only admins can delete invitations (members cannot)
CREATE POLICY "Company admins can delete invitations for their company"
  ON company_invitations FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id = company_invitations.company_id
      AND company_role = 'admin'
    )
  );

COMMENT ON POLICY "Company admins can delete invitations for their company" ON company_invitations IS 
  'Allows company admins to delete (cancel) pending invitations for their company. Regular members cannot delete invitations.';
