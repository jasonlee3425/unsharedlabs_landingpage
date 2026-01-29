# Company Creation Flow

This document explains what happens when a user clicks "Create Company" button.

## Step-by-Step Flow

### 1. **Frontend: User Clicks Button** 
📁 `frontend/app/dashboard/company/page.tsx` (line 88-142)

```typescript
handleCreateCompany() {
  // Step 1.1: Validate company name
  if (!companyName.trim()) return
  
  // Step 1.2: Get session token from localStorage
  const sessionToken = localStorage.getItem('sb-access-token')
  
  // Step 1.3: Make POST request to /api/companies
  fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ name: companyName.trim() }),
  })
}
```

**What happens:**
- ✅ Validates company name is not empty
- ✅ Gets authentication token from browser storage
- ✅ Sends POST request with company name to API endpoint

---

### 2. **API Route: Authentication & Validation**
📁 `frontend/app/api/companies/route.ts` (line 9-91)

```typescript
POST /api/companies {
  // Step 2.1: Extract session token from headers or cookies
  const sessionToken = authHeader || cookie
  
  // Step 2.2: Validate session token exists
  if (!sessionToken) return 401 "Not authenticated"
  
  // Step 2.3: Create Supabase client with user's session
  const supabase = createClient(url, anonKey, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  })
  
  // Step 2.4: Verify user is authenticated
  const { user } = await supabase.auth.getUser()
  if (!user) return 401 "Invalid session"
  
  // Step 2.5: Parse and validate request body
  const { name } = await request.json()
  if (!name?.trim()) return 400 "Company name is required"
  
  // Step 2.6: Call backend service to create company
  const { company, error } = await createCompany(supabase, name, user.id)
}
```

**What happens:**
- ✅ Extracts authentication token from request
- ✅ Creates Supabase client with user's session (not admin)
- ✅ Verifies user is authenticated via `supabase.auth.getUser()`
- ✅ Validates company name is provided
- ✅ Calls backend service function

---

### 3. **Backend Service: Database Operations**
📁 `backend/services/company.service.ts` (line 15-75)

```typescript
createCompany(supabaseClient, name, userId) {
  // Step 3.1: INSERT into companies table
  const { newCompany, error } = await supabaseClient
    .from('companies')
    .insert({ name: name.trim() })
    .select('id, name, created_at, updated_at')
    .single()
  
  if (error) return { error: "Failed to create company" }
  
  // Step 3.2: UPDATE user_profiles table
  const { error: profileError } = await supabaseClient
    .from('user_profiles')
    .update({ 
      company_id: newCompany.id,
      role: 'client'
    })
    .eq('user_id', userId)
  
  if (profileError) {
    // Step 3.3: Rollback - delete company if profile update fails
    await supabaseClient.from('companies').delete().eq('id', newCompany.id)
    return { error: "Failed to update user profile" }
  }
  
  return { company: newCompany }
}
```

**What happens:**
- ✅ **INSERT** into `companies` table with company name
- ✅ **UPDATE** `user_profiles` table to link user to company
- ✅ Sets user's `company_id` to the new company's ID
- ✅ Sets user's `role` to `'client'`
- ✅ **Rollback**: If profile update fails, deletes the company (cleanup)

---

### 4. **API Route: Response**
📁 `frontend/app/api/companies/route.ts` (line 76-81)

```typescript
// Step 4.1: Return success response
return NextResponse.json({
  success: true,
  company: {
    id: "...",
    name: "...",
    created_at: "...",
    updated_at: "..."
  }
})
```

**What happens:**
- ✅ Returns JSON response with created company data
- ✅ Status code: 200 (success)

---

### 5. **Frontend: Handle Response**
📁 `frontend/app/dashboard/company/page.tsx` (line 117-124)

```typescript
if (data.success) {
  // Step 5.1: Update local state with new company
  setCompany(data.company)
  
  // Step 5.2: Close create company modal
  setShowCreateCompany(false)
  setCompanyName('')
  
  // Step 5.3: Refresh user data to get updated companyId
  await refreshUser()
  
  // Step 5.4: Fetch company members/data
  await fetchCompanyData()
} else {
  // Step 5.5: Show error message
  alert(data.error)
}
```

**What happens:**
- ✅ Updates UI with new company data
- ✅ Closes the create company modal
- ✅ Refreshes user context (to get updated `companyId`)
- ✅ Fetches company members and other company data
- ✅ Shows success/error message to user

---

## Database Operations Summary

### Transaction Flow:

1. **INSERT** `companies` table
   ```sql
   INSERT INTO companies (name) 
   VALUES ('Company Name')
   RETURNING id, name, created_at, updated_at
   ```

2. **UPDATE** `user_profiles` table
   ```sql
   UPDATE user_profiles 
   SET company_id = '<new_company_id>', role = 'client'
   WHERE user_id = '<user_id>'
   ```

3. **ROLLBACK** (if step 2 fails)
   ```sql
   DELETE FROM companies 
   WHERE id = '<new_company_id>'
   ```

---

## Required RLS Policies

For this flow to work, you need these RLS policies:

1. **Companies Table:**
   - ✅ `INSERT` policy: Allow authenticated users to create companies
   - ✅ `UPDATE` policy: Allow users to update their own company
   - ✅ `DELETE` policy: Allow users to delete their own company (for rollback)
   - ✅ `SELECT` policy: Allow users to view their own company

2. **User Profiles Table:**
   - ✅ `UPDATE` policy: Allow users to update their own profile
   - ✅ `SELECT` policy: Allow users to view their own profile

---

## Error Handling

### Possible Errors:

1. **401 Unauthorized**
   - No session token provided
   - Invalid/expired session token
   - User not authenticated

2. **400 Bad Request**
   - Company name is empty or missing

3. **500 Internal Server Error**
   - RLS policy blocking INSERT (missing INSERT policy)
   - RLS policy blocking UPDATE (missing UPDATE policy)
   - Database constraint violation
   - Network/database connection error

### Error Flow:

```
Error in Step 3.1 (INSERT company) 
  → Return error to API route
  → Return 500 to frontend
  → Show error alert to user

Error in Step 3.2 (UPDATE profile)
  → Delete company (rollback)
  → Return error to API route
  → Return 500 to frontend
  → Show error alert to user
```

---

## Key Points

1. **Uses Authenticated User's Session**: Not admin/service role - uses the logged-in user's Supabase client
2. **Two-Step Transaction**: Creates company, then links user to it
3. **Automatic Rollback**: If profile update fails, company is deleted to maintain data consistency
4. **Role Assignment**: User's role is set to `'client'` when they create a company
5. **UI Refresh**: After success, user data and company data are refreshed to show updated state
