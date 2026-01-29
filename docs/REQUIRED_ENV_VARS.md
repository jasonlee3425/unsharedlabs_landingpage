# Required Environment Variables

This document lists all environment variables needed for the application to function properly.

## Required Variables

### Supabase (Required)
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Where to get:**
- Supabase Dashboard → Settings → API
- Copy the "Project URL" and "anon/public" key

### Supabase Service Role (Recommended)
```bash
SUPABASE_API_KEY=your-api-key
```

**Where to get:**
- Supabase Dashboard → Settings → API
- Copy the "service_role" key (keep this secret!)

**Why needed:**
- Bypasses RLS for admin operations
- Required for creating user profiles during signup
- Needed for accepting invitations

## Optional but Recommended

### Brevo API (Required for Invitation Emails)
```bash
BREVO_API_KEY=your-brevo-api-key
```

**Where to get:**
- Brevo Dashboard → Settings → SMTP & API → API Keys
- Create a new API key if you don't have one

**Why needed:**
- Sends invitation emails when admins invite team members
- Without this, invitations will fail to send emails

### Email Configuration (Optional - has defaults)
```bash
EMAIL_FROM_ADDRESS=support@unsharedlabs.com
EMAIL_FROM_NAME=Unshared Labs
```

**Defaults:**
- `EMAIL_FROM_ADDRESS` defaults to `support@unsharedlabs.com`
- `EMAIL_FROM_NAME` defaults to `Unshared Labs`

**Note:** The sender email must be verified in your Brevo account.

### Site URL (Optional - has default)
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Default:** `http://localhost:3000`

**Why needed:**
- Used in invitation email links
- Set to your production URL in production (e.g., `https://yourdomain.com`)

## Complete .env.local Example

Create `frontend/.env.local` with:

```bash
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_API_KEY=your-api-key-here

# Brevo (Required for invitations)
BREVO_API_KEY=your-brevo-api-key-here

# Email (Optional - has defaults)
EMAIL_FROM_ADDRESS=support@unsharedlabs.com
EMAIL_FROM_NAME=Unshared Labs

# Site URL (Optional - has default)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Checking What You Have

To check which variables are set, you can run:

```bash
cd frontend
node -e "require('dotenv').config({ path: '.env.local' }); console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING'); console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'); console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? 'SET' : 'MISSING'); console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET' : 'MISSING');"
```

## Missing Variables Impact

| Variable | Impact if Missing |
|----------|------------------|
| `SUPABASE_URL` | ❌ App won't connect to database |
| `SUPABASE_ANON_KEY` | ❌ Authentication won't work |
| `SUPABASE_API_KEY` | ⚠️ Some operations may fail (signup, invitations) |
| `BREVO_API_KEY` | ⚠️ Invitation emails won't send (but invitation records will be created) |
| `EMAIL_FROM_ADDRESS` | ✅ Uses default: `support@unsharedlabs.com` |
| `EMAIL_FROM_NAME` | ✅ Uses default: `Unshared Labs` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Uses default: `http://localhost:3000` |
