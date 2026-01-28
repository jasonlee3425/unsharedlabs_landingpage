/**
 * Client-side authentication functions
 * These call the backend API routes
 */

export interface AuthResponse {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
  }
  session?: {
    access_token: string
    refresh_token: string
  }
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, companyName?: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, companyName }),
    })

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Server error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response isn't JSON, use status text
      }
      console.error('Sign up API error:', errorMessage)
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Sign up fetch error:', error)
    // More specific error message
    if (error.message) {
      return { success: false, error: `Network error: ${error.message}` }
    }
    return { success: false, error: 'Failed to connect to server. Please check your internet connection.' }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    
    // Store session token in localStorage if successful
    if (data.success && data.session) {
      localStorage.setItem('sb-access-token', data.session.access_token)
      localStorage.setItem('sb-refresh-token', data.session.refresh_token)
      localStorage.setItem('sb-user', JSON.stringify(data.user))
    }

    return data
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { success: false, error: 'Failed to connect to server' }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionToken = localStorage.getItem('sb-access-token')
    
    if (!sessionToken) {
      // Clear local storage anyway
      localStorage.removeItem('sb-access-token')
      localStorage.removeItem('sb-refresh-token')
      localStorage.removeItem('sb-user')
      return { success: true }
    }

    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    })

    const data = await response.json()

    // Clear local storage
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('sb-refresh-token')
    localStorage.removeItem('sb-user')

    return data
  } catch (error: any) {
    console.error('Sign out error:', error)
    // Clear local storage even if API call fails
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('sb-refresh-token')
    localStorage.removeItem('sb-user')
    return { success: true }
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): { id: string; email: string } | null {
  try {
    const userStr = localStorage.getItem('sb-user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Get session token from localStorage
 */
export function getSessionToken(): string | null {
  return localStorage.getItem('sb-access-token')
}
