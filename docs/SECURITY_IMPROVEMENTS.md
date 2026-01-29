# Security Improvements: Backend Service Layer

## Overview

This document outlines the security improvements made to ensure that:
1. **Frontend never directly calls Supabase** - All database operations go through backend services
2. **Frontend never directly calls external services** - All external API calls are handled by backend services
3. **API routes are thin wrappers** - Business logic lives in backend services

## Architecture Pattern

```
Frontend (Client Components)
    ↓
API Routes (frontend/app/api/*)
    ↓
Backend Services (backend/services/*)
    ↓
Supabase/External Services
```

## Changes Made

### 1. Created Verification Service (`backend/services/verification.service.ts`)

**Purpose**: Centralizes all verification-related operations including external email service integration.

**Functions**:
- `createSender()` - Creates sender in external email service
- `validateOtp()` - Validates OTP with external email service
- `getVerificationSettings()` - Fetches verification settings from Supabase
- `saveVerificationSettings()` - Saves/updates verification settings in Supabase
- `updatePreventionStep()` - Updates prevention step completion status

**Benefits**:
- ✅ External email service URL is only in backend (not exposed to frontend)
- ✅ All Supabase operations use admin client (proper RLS handling)
- ✅ Reusable across multiple API routes
- ✅ Easier to test and maintain

### 2. Refactored Verification API Route

**Before**: 
- Direct fetch calls to `https://emailservice.unsharedlabs.com/api`
- Direct Supabase client creation in API route
- Business logic mixed with route handling

**After**:
- Uses `verification.service.ts` for all operations
- Clean separation of concerns
- Easier to maintain and test

### 3. Updated Type Definitions

- Added `company_role` to `UserProfile` type in `backend/types/auth.types.ts`
- Ensures type safety across the application

## Security Benefits

### 1. **API Keys Protection**
- External service URLs and credentials are never exposed to frontend
- All sensitive operations happen server-side

### 2. **Consistent Authorization**
- All database operations go through backend services
- Centralized authorization checks
- Easier to audit and maintain

### 3. **Rate Limiting & Validation**
- Can add rate limiting at the service layer
- Input validation happens before external calls
- Better error handling

### 4. **Future-Proof**
- Easy to add caching, logging, monitoring
- Can swap out external services without frontend changes
- Better separation of concerns

## Completed Work ✅

### High Priority - COMPLETED
1. **✅ Created shared authentication helper** (`backend/lib/auth-helper.ts`)
   - `authenticateRequest()` - Centralized authentication for all API routes
   - `hasCompanyAccess()` - Check company access permissions
   - `isCompanyAdmin()` - Check if user is company admin
   - `isSuperAdmin()` - Check if user is super admin
   - Eliminates code duplication across API routes

2. **✅ Created additional services**:
   - `verification.service.ts` - Handles verification operations and external email service
   - `api-key.service.ts` - Handles API key generation and management
   - `onboarding.service.ts` - Handles onboarding state management
   - `data.service.ts` - Handles company data operations

3. **✅ Refactored API routes**:
   - `/api/companies/[companyId]/verification` - Uses auth helper + verification service
   - `/api/companies/[companyId]/api-key` - Uses auth helper + api-key service
   - `/api/companies/[companyId]/onboarding` - Uses auth helper + onboarding service
   - `/api/companies/[companyId]/data` - Uses auth helper + data service

## Remaining Work

### Medium Priority
1. **Review other API routes** - Some routes still create Supabase clients directly
   - `/api/companies/route.ts` - Company creation
   - `/api/companies/members/*` - Member management
   - `/api/invite/*` - Invitation management
   - `/api/admin/*` - Admin operations
   - Consider refactoring these to use auth helper and services

### Medium Priority
1. **Shared authentication helper** - Reduce code duplication in API routes
2. **Error handling standardization** - Consistent error responses
3. **Request validation** - Add input validation at service layer

### Low Priority
1. **Service layer tests** - Unit tests for backend services
2. **API documentation** - Document all service functions
3. **Monitoring & logging** - Add structured logging to services

## Best Practices Going Forward

1. **Never call external services from frontend** - Always use backend services
2. **Never create Supabase clients in frontend** - Use API routes + backend services
3. **Keep API routes thin** - They should only:
   - Authenticate the request
   - Call backend services
   - Return responses
4. **Put business logic in services** - Services handle:
   - Database operations
   - External API calls
   - Data transformation
   - Validation

## Example: Adding a New Feature

```typescript
// ❌ BAD: Direct call from frontend
const response = await fetch('https://external-api.com/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
})

// ✅ GOOD: Use backend service
// 1. Create service function
// backend/services/my-feature.service.ts
export async function callExternalAPI(data: MyData) {
  // Handle external API call
  // Handle errors
  // Return formatted response
}

// 2. Create API route
// frontend/app/api/my-feature/route.ts
export async function POST(request: NextRequest) {
  // Authenticate
  // Call service
  // Return response
}

// 3. Call from frontend
const response = await fetch('/api/my-feature', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

## Files Changed

- ✅ `backend/services/verification.service.ts` (NEW)
- ✅ `frontend/app/api/companies/[companyId]/verification/route.ts` (REFACTORED)
- ✅ `backend/types/auth.types.ts` (UPDATED)

## Next Steps

1. Review and refactor other API routes to use backend services
2. Create shared authentication helper for API routes
3. Document all backend services
4. Add unit tests for services
