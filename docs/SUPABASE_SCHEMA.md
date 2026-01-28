# Supabase Database Schema

This document describes the database tables and Row Level Security (RLS) policies needed for role-based access control.

## Tables

### 1. `companies` Table

Stores company/client organizations.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Super admins can see all companies
CREATE POLICY "Super admins can view all companies"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- Clients can only see their own company
CREATE POLICY "Clients can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );
```

### 2. `user_profiles` Table

Stores user profile information including role and company association.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'client')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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

-- Service role can insert/update (for signup)
CREATE POLICY "Service role can manage profiles"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Indexes

```sql
-- Index for faster lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

## Setup Instructions

1. **Create the tables in Supabase SQL Editor:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL statements above in order

2. **Create a super admin user:**
   - After creating the tables, you'll need to manually create a super admin user
   - Sign up a user through the app
   - Then run this SQL to make them a super admin:
   ```sql
   UPDATE user_profiles
   SET role = 'super_admin', company_id = NULL
   WHERE email = 'your-admin-email@example.com';
   ```

3. **Create companies:**
   - Super admins can create companies through the admin dashboard
   - Or you can insert them directly:
   ```sql
   INSERT INTO companies (name) VALUES ('Company Name');
   ```

4. **Assign clients to companies:**
   - When a client signs up, they should be assigned to a company
   - This can be done during signup or by a super admin later

## Notes

- **Super Admin Role**: Users with `role = 'super_admin'` can access all companies and see all users
- **Client Role**: Users with `role = 'client'` can only access data for their assigned `company_id`
- **RLS Policies**: Row Level Security ensures data isolation at the database level
- **Service Role**: The service role key bypasses RLS, so use it carefully in server-side code
