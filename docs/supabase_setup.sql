-- ============================================================================
-- Supabase Database Schema Setup
-- Role-Based Authentication System
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Run it in order to set up tables, RLS policies, and indexes
-- ============================================================================

-- ============================================================================
-- 1. Create companies table
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Create user_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'client')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- 5. RLS Policies for companies table
-- ============================================================================

-- Super admins can view all companies
CREATE POLICY "Super admins can view all companies"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Clients can only view their own company
CREATE POLICY "Clients can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. RLS Policies for user_profiles table
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

-- Allow authenticated users to insert their own profile
-- (This is used during signup via service role, but this policy allows direct inserts too)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. Create function to automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Next steps:
-- 1. Sign up a user through your app
-- 2. Make them a super admin by running:
--    UPDATE user_profiles
--    SET role = 'super_admin', company_id = NULL
--    WHERE email = 'your-admin-email@example.com';
-- ============================================================================
