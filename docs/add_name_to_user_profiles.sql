-- ============================================================================
-- Add name field to user_profiles table
-- This stores the display name for users
-- ============================================================================

-- Add name column (nullable - optional display name)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for faster lookups (optional, but helpful if you search by name)
CREATE INDEX IF NOT EXISTS idx_user_profiles_name ON user_profiles(name) 
WHERE name IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.name IS 'Optional display name for the user. If not set, email is used as display name.';
