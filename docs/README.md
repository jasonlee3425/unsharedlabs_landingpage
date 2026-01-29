# Unshared Labs Landing Page

A modern landing page for Unshared Labs, built with Next.js 14, TypeScript, and Tailwind CSS.

## Project Structure

```
unsharedlabs_landingpage/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── api/                # API routes (backend endpoints)
│   │   │   └── auth/           # Authentication endpoints
│   │   │       ├── signin/     # POST /api/auth/signin
│   │   │       ├── signup/     # POST /api/auth/signup
│   │   │       └── signout/    # POST /api/auth/signout
│   │   ├── contact/            # Contact page
│   │   ├── dashboard/          # Protected dashboard page
│   │   ├── docs/               # Documentation page
│   │   ├── pricing/            # Pricing page
│   │   ├── signin/             # Sign in page (redirects to signup)
│   │   ├── signup/             # Sign up/Sign in page
│   │   └── page.tsx            # Homepage
│   ├── components/             # React components
│   │   └── Navigation.tsx      # Navigation with auth buttons
│   ├── lib/                    # Client-side utilities
│   │   ├── auth.ts             # Auth functions (calls API)
│   │   └── auth-context.tsx    # Auth context provider
│   └── ...
├── backend/                    # Shared backend utilities
│   ├── lib/                    # Server-side utilities
│   │   └── supabase.ts         # Server-side Supabase client
│   ├── services/               # Business logic services
│   │   └── auth.service.ts     # Authentication service
│   └── types/                  # TypeScript type definitions
│       └── auth.types.ts       # Authentication types
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Modern Design**: Dark theme with gradient effects and smooth animations
- **Responsive**: Mobile-first design that works on all devices
- **No CORS Issues**: Frontend and backend API routes in the same Next.js app
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Pages

- **Homepage** (`/`): Main landing page with hero, features, and demo
- **Pricing** (`/pricing`): Pricing plans and FAQ
- **Documentation** (`/docs`): SDK documentation and integration guides
- **Contact** (`/contact`): Contact form and support information
- **Sign Up/Sign In** (`/signup`): Combined authentication page with mode toggle
- **Dashboard** (`/dashboard`): Protected dashboard page (requires authentication)

## API Routes

API routes are located in `frontend/app/api/` and can be accessed without CORS issues since they're part of the same Next.js application.

### Authentication Endpoints

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/signin` - Sign in an existing user
- `POST /api/auth/signout` - Sign out the current user

### Other Endpoints

- `POST /api/contact` - Contact form submissions

## Backend Architecture

The `backend/` directory follows a clean architecture pattern:

### Services Layer
Business logic lives in `backend/services/`. For example, `auth.service.ts` handles all authentication operations.

### API Routes
API routes in `frontend/app/api/` are thin wrappers that:
1. Validate request data
2. Call service functions
3. Return formatted responses

### Example Flow

```typescript
// frontend/app/api/auth/signin/route.ts
import { signIn } from '../../../../../backend/services/auth.service'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await signIn({ email: body.email, password: body.password })
  return NextResponse.json(result)
}
```

## Authentication

The app uses Supabase for authentication with a clean separation:

- **Frontend** (`frontend/lib/auth.ts`): Client-side functions that call API routes
- **API Routes** (`frontend/app/api/auth/`): Handle HTTP requests/responses
- **Services** (`backend/services/auth.service.ts`): Business logic and Supabase operations
- **Context** (`frontend/lib/auth-context.tsx`): React context for auth state

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_API_KEY=your-api-key (optional)
```

## Deployment

This application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting platform**

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `frontend`
4. Deploy!

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Supabase
- **State Management**: React Context API

## License

See LICENSE file for details.
