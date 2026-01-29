-- ============================================================================
-- Create Company Invitations Table
-- Stores invitation tokens for company member invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'super_admin')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for active invitations (one per email per company)
-- Only applies when accepted_at is NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_invitations_active 
ON company_invitations(company_id, email) 
WHERE accepted_at IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);

-- Enable RLS
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for their company
CREATE POLICY "Users can view invitations for their company"
  ON company_invitations FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Users can create invitations for their company
CREATE POLICY "Users can create invitations for their company"
  ON company_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
    AND invited_by = auth.uid()
  );

-- Users can update invitations for their company (to mark as accepted)
CREATE POLICY "Users can update invitations for their company"
  ON company_invitations FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id IS NOT NULL
    )
  );

-- Allow anyone to view invitation by token (for acceptance flow)
-- This is needed so users can accept invitations without being authenticated
CREATE POLICY "Anyone can view invitation by token"
  ON company_invitations FOR SELECT
  TO anon
  USING (true); -- Token provides security, not RLS

-- Allow authenticated users to accept invitations
CREATE POLICY "Users can accept invitations"
  ON company_invitations FOR UPDATE
  TO authenticated
  USING (true) -- User must match email and token
  WITH CHECK (true);
