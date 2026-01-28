# Email Troubleshooting Guide

## Error: "Error sending confirmation email"

This error typically occurs when Supabase can't send emails through Brevo SMTP. Here are the most common causes and solutions:

### 1. Sender Email Not Verified in Brevo

**Problem**: Brevo requires sender emails to be verified before sending.

**Solution**:
1. Go to Brevo Dashboard → **Senders & IP**
2. Click **Add a sender**
3. Enter `support@unsharedlabs.com`
4. Verify the email address (Brevo will send a confirmation email)
5. Click the verification link in the email
6. Wait for the sender to be approved (usually instant, but can take a few minutes)

### 2. Incorrect SMTP Credentials

**Problem**: Wrong username or password in Supabase SMTP settings.

**Solution**:
1. Double-check your Brevo SMTP credentials:
   - **Username**: Should be your Brevo account email (the one you use to log in)
   - **Password**: Should be your SMTP password (NOT your Brevo account password)
   - To get/create SMTP password: Brevo Dashboard → Settings → SMTP & API → SMTP → Generate SMTP password

2. Verify in Supabase:
   - Supabase Dashboard → Settings → Auth → SMTP Settings
   - Make sure the username and password match exactly
   - No extra spaces or characters

### 3. SMTP Configuration Issues

**Verify your Supabase SMTP settings are correct**:
- **Host**: `smtp-relay.brevo.com` (not `smtp.brevo.com`)
- **Port**: `587` (for TLS) or `465` (for SSL)
- **Secure**: Enable TLS/STARTTLS (if using port 587)
- **Sender email**: `support@unsharedlabs.com`
- **Sender name**: `Unshared Labs`

### 4. Domain Authentication (SPF/DKIM)

**Problem**: Emails might be blocked if domain isn't authenticated.

**Solution** (for better deliverability):
1. In Brevo Dashboard → Senders & IP
2. Set up SPF and DKIM records for your domain
3. Add the DNS records to your domain's DNS settings

**Note**: This is optional but recommended for production. For testing, you can skip this.

### 5. Brevo Account Limits

**Check**:
- Go to Brevo Dashboard → Settings → Account
- Verify you haven't exceeded your daily email limit (300/day on free tier)
- Check if your account is in good standing

### 6. Test SMTP Connection

**In Supabase**:
1. Go to Settings → Auth → SMTP Settings
2. Look for a "Test Connection" or "Send Test Email" button
3. Use it to verify the SMTP connection works

### Quick Checklist

- [ ] Sender email `support@unsharedlabs.com` is verified in Brevo
- [ ] SMTP username is your Brevo account email
- [ ] SMTP password is the SMTP-specific password (not account password)
- [ ] Host is `smtp-relay.brevo.com`
- [ ] Port is `587` with TLS enabled
- [ ] No typos in any credentials
- [ ] Brevo account is active and not suspended

### Still Not Working?

1. **Check Supabase logs**:
   - Supabase Dashboard → Logs → Auth Logs
   - Look for specific error messages

2. **Check Brevo logs**:
   - Brevo Dashboard → Statistics → Email Logs
   - See if emails are being attempted and why they're failing

3. **Temporary workaround**:
   - Disable email confirmation in Supabase (Settings → Auth → Disable "Enable email confirmations")
   - Users can sign in immediately without confirmation
   - Fix SMTP later and re-enable
