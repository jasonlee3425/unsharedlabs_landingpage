# Role-Based Authentication Setup Guide

This guide explains how to set up and use the role-based authentication system with Supabase.

## Overview

The system supports two user roles:
- **Super Admin**: Can view all companies and access any company's dashboard
- **Client**: Can only view their own company's dashboard and data

## Database Setup

### Step 1: Create Tables in Supabase

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the SQL statements from `SUPABASE_SCHEMA.md` in order:
   - Create `companies` table
   - Create `user_profiles` table
   - Create indexes
   - Set up Row Level Security (RLS) policies

### Step 2: Create Your First Super Admin

After creating the tables, you need to manually create a super admin user:

1. Sign up a user through the app (or create one in Supabase Auth)
2. Note the user's email
3. Run this SQL in Supabase SQL Editor:

```sql
UPDATE user_profiles
SET role = 'super_admin', company_id = NULL
WHERE email = 'your-admin-email@example.com';
```

Alternatively, you can insert a super admin profile directly:

```sql
-- First, get the user_id from auth.users
-- Then insert into user_profiles
INSERT INTO user_profiles (user_id, email, role, company_id)
VALUES (
  'user-uuid-from-auth-users',
  'admin@example.com',
  'super_admin',
  NULL
);
```

## How It Works

### User Signup Flow

1. **Client Signup**:
   - User signs up with email, password, and optionally a company name
   - If company name is provided, a new company is created (or existing one is used)
   - User profile is created with `role = 'client'` and `company_id` set
   - User is redirected to `/dashboard` (client dashboard)

2. **Super Admin Signup**:
   - Super admins must be manually assigned via database
   - After signup, update their profile to `role = 'super_admin'` and `company_id = NULL`

### Authentication Flow

1. **Sign In**:
   - User signs in with email and password
   - System fetches user profile with role and company info
   - Based on role:
     - **Super Admin** → Redirected to `/admin`
     - **Client** → Redirected to `/dashboard`

2. **Dashboard Access**:
   - **Super Admin Dashboard** (`/admin`):
     - Lists all companies
     - Can click into any company to view its dashboard
     - Can see all clients across all companies
   
   - **Client Dashboard** (`/dashboard`):
     - Shows company-specific data
     - Only displays data for their assigned company
     - Cannot access other companies' data

### Data Isolation

Row Level Security (RLS) policies ensure:
- Clients can only query data for their own company
- Super admins can query all data
- Database-level security prevents unauthorized access

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in existing user
- `POST /api/auth/signout` - Sign out current user
- `GET /api/auth/me` - Get current user profile with role and company info

### Admin (Super Admin Only)
- `GET /api/admin/companies` - Get all companies
- `GET /api/admin/companies/[companyId]` - Get company by ID
- `GET /api/admin/companies/[companyId]/clients` - Get clients for a company
- `GET /api/admin/clients` - Get all clients

## Pages

- `/signup` - Sign up page (includes optional company name field)
- `/signin` - Sign in page (redirects to `/signup?mode=signin`)
- `/dashboard` - Client dashboard (company-specific)
- `/admin` - Super admin dashboard (lists all companies)
- `/admin/companies/[companyId]` - Company detail view (super admin only)

## Navigation

The navigation component automatically shows:
- **For Super Admins**: "Admin" link → `/admin`
- **For Clients**: "Dashboard" link → `/dashboard`
- **For Guests**: "Sign In" and "Get Started" links

## Adding Company-Specific Data

To add company-specific data tables:

1. Create a table with a `company_id` column:
```sql
CREATE TABLE company_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Add RLS policies:
```sql
ALTER TABLE company_data ENABLE ROW LEVEL SECURITY;

-- Clients can only see their company's data
CREATE POLICY "Clients can view their company data"
  ON company_data FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Super admins can see all data
CREATE POLICY "Super admins can view all data"
  ON company_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );
```

## Testing

1. **Test Client Flow**:
   - Sign up with a company name
   - Should be redirected to `/dashboard`
   - Should see company name displayed
   - Should not be able to access `/admin`

2. **Test Super Admin Flow**:
   - Create a super admin (via SQL)
   - Sign in
   - Should be redirected to `/admin`
   - Should see list of companies
   - Should be able to click into any company

## Troubleshooting

### User doesn't have a profile
- Check if `user_profiles` table exists
- Verify the signup process created a profile
- Manually create a profile if needed

### RLS policies blocking queries
- Verify RLS is enabled on tables
- Check that policies are correctly set up
- Ensure user has a profile with correct role/company_id

### Super admin can't see companies
- Verify role is set to `'super_admin'` (not `'client'`)
- Check that `company_id` is `NULL` for super admins
- Verify RLS policies allow super admin access

## Security Notes

- Always use the service role key on the server side (never expose it to the client)
- RLS policies provide database-level security
- Client-side role checks are for UX only - always verify on the server
- Super admin access should be carefully controlled
