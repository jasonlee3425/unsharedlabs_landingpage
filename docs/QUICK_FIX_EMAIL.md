# Quick Fix: Disable Email Confirmation

To immediately stop the "email rate limit exceeded" error:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Auth**
4. Scroll down to **Email Auth** section
5. **Disable** "Enable email confirmations"
6. Save changes

**Result**: Users can now sign up and sign in immediately without email confirmation.

**Note**: This is a temporary solution. For production, you should:
- Configure Brevo SMTP in Supabase (see BREVO_SETUP.md)
- Re-enable email confirmations
- Or implement custom email confirmation using Brevo API
