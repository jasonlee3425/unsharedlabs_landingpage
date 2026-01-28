# Debugging Email Confirmation Errors

## How to Get More Details About Email Errors

### 1. Check Server Logs

When you try to sign up, check your terminal/console where the Next.js server is running. You should now see detailed error logs including:
- Full error message from Supabase
- Error status code
- Error name/type
- Complete error object

### 2. Check Supabase Dashboard Logs

1. Go to your Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Look for recent signup attempts
4. Click on any errors to see detailed information

### 3. Check Brevo Dashboard

1. Go to Brevo Dashboard
2. Navigate to **Statistics** → **Email Logs**
3. Check if emails are being attempted
4. Look for any delivery failures or errors

### 4. Common Error Messages and Solutions

#### "Error sending confirmation email"
- **Cause**: SMTP configuration issue or sender email not verified
- **Check**:
  - Is `support@unsharedlabs.com` verified in Brevo?
  - Are SMTP credentials correct in Supabase?
  - Is the SMTP host `smtp-relay.brevo.com` (not `smtp.brevo.com`)?

#### "Email rate limit exceeded"
- **Cause**: Still using Supabase's default email service
- **Solution**: Make sure Custom SMTP is enabled in Supabase

#### "Authentication failed" or "Invalid credentials"
- **Cause**: Wrong SMTP username or password
- **Check**:
  - Username should be your Brevo account email
  - Password should be your SMTP password (not account password)
  - No extra spaces in credentials

#### "Connection timeout" or "Connection refused"
- **Cause**: Wrong SMTP host or port
- **Check**:
  - Host: `smtp-relay.brevo.com`
  - Port: `587` (with TLS) or `465` (with SSL)

### 5. Test SMTP Connection in Supabase

1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Look for a "Test Connection" or "Send Test Email" button
3. Use it to verify your SMTP settings work
4. Check the error message if it fails

### 6. Enable Detailed Logging

The code now logs detailed error information. When you see an error:
1. Check your server console/terminal
2. Look for the detailed error log
3. Share the full error message for debugging

### 7. Check Supabase Auth Settings

1. Go to Supabase Dashboard → Settings → Auth
2. Verify:
   - "Enable email confirmations" is enabled (if you want email confirmation)
   - "Custom SMTP" is enabled
   - All SMTP fields are filled correctly

### 8. Verify Brevo Sender

1. Go to Brevo Dashboard → Senders & IP
2. Make sure `support@unsharedlabs.com` shows as:
   - **Status**: Verified/Active
   - **Not**: Pending or Rejected

### Getting Help

If you're still seeing errors, provide:
1. The full error message from server logs
2. Screenshot of Supabase SMTP settings (hide passwords)
3. Status of sender email in Brevo
4. Any error messages from Supabase Auth Logs
