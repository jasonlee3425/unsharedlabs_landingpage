# Sign-Up Troubleshooting Guide

## Current Status: Sign-Ups Should Be Self-Serviceable

The sign-up flow is designed to allow any user to create an account. Here's what might be blocking sign-ups and how to fix it:

## Potential Blockers

### 1. Email Confirmation (Most Common Issue)

**Problem**: Supabase requires email confirmation by default. If SMTP isn't configured, users can't complete sign-up.

**Solution Options**:

**Option A: Disable Email Confirmation (Quick Fix for Development)**
1. Go to Supabase Dashboard → Settings → Auth
2. Under "Email Auth", disable "Enable email confirmations"
3. Save changes
4. Users can now sign up and sign in immediately

**Option B: Configure SMTP (Production Solution)**
1. Set up Brevo SMTP (see `BREVO_SETUP.md`)
2. Configure SMTP in Supabase Dashboard → Settings → Auth → SMTP Settings
3. Keep email confirmations enabled

### 2. Missing Service Role Key

**Problem**: If `SUPABASE_SERVICE_ROLE_KEY` is not set, the app falls back to the anon key, which may be restricted by RLS policies.

**Solution**:
1. Get your service role key from Supabase Dashboard → Settings → API
2. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. Restart your development server

**Note**: The service role key bypasses RLS policies, so it's essential for sign-ups to work properly.

### 3. Row Level Security (RLS) Policies

**Problem**: If RLS policies are too restrictive, profile creation might fail.

**Solution**: 
1. Run the updated SQL in `supabase_setup.sql` which includes:
   - Policy allowing users to insert their own profile
   - Policy allowing profile creation during sign-up
2. The service role key should bypass RLS, but these policies provide fallback support

### 4. Database Tables Not Created

**Problem**: If `user_profiles` or `companies` tables don't exist, sign-ups will fail.

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase_setup.sql`
3. Verify tables are created in the Table Editor

## What's NOT Blocking Sign-Ups

### `isEmailAllowed` Function

The `isEmailAllowed` function exists in the codebase but is **NOT being called** during sign-up. This means there's no email allowlist blocking sign-ups. All emails are allowed.

If you want to implement an email allowlist in the future, you would need to:
1. Call `isEmailAllowed()` in the `signUp` function before creating the user
2. Populate the `Expon3nt_allowed_emails` table with allowed email addresses

## Verification Steps

1. **Check Environment Variables**:
   ```bash
   # Make sure these are set in .env.local
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Important!
   ```

2. **Check Supabase Auth Settings**:
   - Email confirmations: Either disabled OR SMTP configured
   - Email templates: Should be set up if using confirmations

3. **Test Sign-Up**:
   - Try signing up with a new email
   - Check browser console for errors
   - Check server logs for detailed error messages
   - Check Supabase Dashboard → Authentication → Users to see if user was created

4. **Check Database**:
   - Verify `user_profiles` table exists
   - Verify RLS policies are set up correctly
   - Check if profile was created after sign-up attempt

## Current Sign-Up Flow

1. User fills out sign-up form (email, password, optional company name)
2. Frontend validates: password length (8+ chars), passwords match, email format
3. API route validates: email format, password length
4. Auth service calls `supabase.auth.signUp()` to create user
5. If successful, creates user profile with role='client'
6. If company name provided, creates or finds company and links it
7. Returns success response

**No email allowlist is checked** - all emails are allowed to sign up.

## Making Sign-Ups Self-Serviceable

Sign-ups are already designed to be self-serviceable. To ensure they work:

1. ✅ **Disable email confirmation** OR **configure SMTP**
2. ✅ **Set SUPABASE_SERVICE_ROLE_KEY** environment variable
3. ✅ **Run supabase_setup.sql** to create tables and policies
4. ✅ **Verify RLS policies** allow profile creation

Once these are in place, any user can sign up without restrictions.
