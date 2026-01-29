-- ============================================================================
-- Add company_role field to company_invitations table
-- This tracks whether the invitee should be an 'admin' or 'member' within the company
-- ============================================================================

-- Add company_role column
ALTER TABLE company_invitations 
ADD COLUMN IF NOT EXISTS company_role TEXT CHECK (company_role IN ('admin', 'member'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_role ON company_invitations(company_role) 
WHERE company_role IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN company_invitations.company_role IS 'Role within the company: admin (can manage members/invites) or member (regular user).';
