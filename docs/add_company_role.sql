-- ============================================================================
-- Add company_role field to user_profiles table
-- This tracks whether a user is an 'admin' or 'member' within their company
-- ============================================================================

-- Add company_role column (nullable - only set when user belongs to a company)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company_role TEXT CHECK (company_role IN ('admin', 'member'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_role ON user_profiles(company_id, company_role) 
WHERE company_role IS NOT NULL;

-- Set existing company creators as admins
-- The first member (earliest created_at) of each company becomes admin
UPDATE user_profiles up1
SET company_role = 'admin'
WHERE up1.company_id IS NOT NULL
  AND up1.company_role IS NULL
  AND up1.created_at = (
    SELECT MIN(up2.created_at)
    FROM user_profiles up2
    WHERE up2.company_id = up1.company_id
  );

-- Set all other existing members as 'member'
UPDATE user_profiles
SET company_role = 'member'
WHERE company_id IS NOT NULL
  AND company_role IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.company_role IS 'Role within the company: admin (can manage members/invites) or member (regular user). NULL if user does not belong to a company.';
