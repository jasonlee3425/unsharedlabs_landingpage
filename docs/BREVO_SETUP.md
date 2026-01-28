# Setting Up Brevo (formerly Sendinblue) with Supabase

This guide will help you configure Supabase to use Brevo for sending authentication emails instead of Supabase's default email service.

## Important: API Key vs SMTP Credentials

**For Supabase SMTP Configuration**, you need **SMTP credentials** (username/password), NOT the API key.

The API key (`BREVO_API_KEY`) is stored in your `.env.local` file and can be used for:
- Direct API calls to Brevo (if you build custom email functionality)
- Programmatic email sending via Brevo's REST API

**For Supabase SMTP**, you still need to get SMTP credentials separately.

## Step 1: Get Your Brevo SMTP Credentials

1. Sign up for a Brevo account at https://www.brevo.com (free tier available)
2. Go to **Settings** → **SMTP & API**
3. Click on **SMTP** tab
4. You'll need:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Login**: Your Brevo account email
   - **Password**: Your SMTP password (create one in Brevo settings if you haven't)
   
   **Note**: The SMTP password is different from your Brevo account password. You need to generate it specifically for SMTP.

## Step 2: Configure Supabase to Use Brevo SMTP

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in the following:
   - **Sender email**: `support@unsharedlabs.com` (stored in `EMAIL_FROM_ADDRESS` env var)
   - **Sender name**: `Unshared Labs` (stored in `EMAIL_FROM_NAME` env var)
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Your Brevo account email
   - **Password**: Your Brevo SMTP password
   - **Secure**: Enable TLS/STARTTLS
   
   **Note**: Make sure `support@unsharedlabs.com` is verified in your Brevo account (see Step 3)

## Step 3: Verify Your Sender Email in Brevo

1. In Brevo dashboard, go to **Senders & IP**
2. Add and verify `support@unsharedlabs.com` as a sender email
3. This is important - Brevo won't send emails from unverified addresses
4. You'll need to verify the email address by clicking a confirmation link sent to that email

## Step 4: Test the Configuration

1. Try signing up a new user
2. Check if the confirmation email arrives
3. Check Brevo dashboard for email logs

## Alternative: Disable Email Confirmation (For Development)

If you want to skip email confirmation during development:

1. Go to Supabase dashboard
2. Navigate to **Settings** → **Auth**
3. Under **Email Auth**, disable **Enable email confirmations**
4. Users can sign in immediately without email confirmation

## Brevo Free Tier Limits

- **300 emails/day** (much better than Supabase's rate limits)
- Unlimited contacts
- Email templates
- SMTP access

## Troubleshooting

- **Emails not sending**: Check Brevo dashboard for delivery status
- **Authentication failed**: Verify your SMTP credentials
- **Emails going to spam**: Set up SPF/DKIM records in Brevo
- **Rate limits**: Upgrade Brevo plan if you need more than 300 emails/day
