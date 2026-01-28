# Fixing Expired Email Confirmation Links

## Problem: Confirmation links expire too quickly

If users are seeing "link expired" errors when clicking the confirmation link in their email, here's how to fix it:

## Solution 1: Increase Link Expiration Time in Supabase

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll down to **Email Auth** section
3. Find **"Confirmation link expiry"** or **"Email confirmation link expiry"**
4. Increase the expiration time (default is usually 1 hour)
   - Recommended: **24 hours** or **48 hours** for better user experience
   - Maximum: **7 days** (168 hours)
5. Click **Save**

## Solution 2: Check Site URL Configuration

The confirmation link uses your site URL. Make sure it's configured correctly:

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/signin`
   - `http://localhost:3000/signin` (for development)
4. Click **Save**

## Solution 3: Handle Expired Links Gracefully

If a link expires, users should be able to request a new confirmation email. You can:

1. Add a "Resend confirmation email" feature on the signin page
2. Or manually resend from Supabase Dashboard → Authentication → Users

## Solution 4: Use Magic Link Instead (Alternative)

Magic links don't expire as quickly. You can configure Supabase to use magic links:

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Under **Email Auth**, enable **"Enable magic link"**
3. Users can sign in with just their email (no password needed)

## Quick Fix: Disable Email Confirmation (Development Only)

For development/testing, you can temporarily disable email confirmation:

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Under **Email Auth**, disable **"Enable email confirmations"**
3. Users can sign in immediately without confirmation

**⚠️ Warning**: Only do this for development. Re-enable for production!

## Recommended Settings for Production

- **Confirmation link expiry**: 24-48 hours
- **Site URL**: Your production domain
- **Redirect URLs**: Include both production and development URLs
- **Email confirmations**: Enabled
- **SMTP**: Configured with Brevo

## Testing

After changing settings:
1. Sign up a new user
2. Check the email immediately
3. Click the confirmation link
4. Verify it works and doesn't expire too quickly
