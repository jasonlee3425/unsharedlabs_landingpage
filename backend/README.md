# Backend Directory

This directory contains shared backend utilities, types, and services that can be used by the frontend API routes.

## Structure

```
backend/
├── lib/           # Shared utilities and helpers
│   └── supabase.ts    # Server-side Supabase client
├── services/      # Business logic services
│   └── auth.service.ts # Authentication service
└── types/         # TypeScript type definitions
    └── auth.types.ts  # Authentication types
```

## Usage

The frontend Next.js app uses API routes in `frontend/app/api/` which import from this backend directory for shared logic.

### Example: Using Auth Service

```typescript
// frontend/app/api/auth/signin/route.ts
import { signIn } from '../../../../../backend/services/auth.service'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await signIn({ email: body.email, password: body.password })
  return NextResponse.json(result)
}
```

## Services

### Auth Service (`services/auth.service.ts`)

Handles all authentication logic:
- `signUp({ email, password, companyName? })` - Create a new user account (self-service, no restrictions)
- `signIn({ email, password })` - Sign in an existing user
- `signOut(sessionToken)` - Sign out the current user
- `getUserProfile(userId)` - Get user profile with role and company information

## Environment Variables

Required environment variables (set in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional, for admin operations)
```

## Architecture

- **Separation of Concerns**: Business logic lives in `services/`, API routes are thin wrappers
- **Type Safety**: All types defined in `types/` directory
- **Reusability**: Services can be imported by any API route
- **No CORS Issues**: Everything runs in the same Next.js app
