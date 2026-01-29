'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getCurrentUser, getSessionToken, signOut as signOutUser } from './auth'

interface User {
  id: string
  email: string
  name?: string
  role?: 'super_admin' | 'client'
  companyId?: string
  companyName?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const fetchUserProfile = useCallback(async () => {
    const sessionToken = getSessionToken()
    if (!sessionToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          // Also update localStorage for backward compatibility
          if (typeof window !== 'undefined') {
            localStorage.setItem('sb-user', JSON.stringify(data.user))
          }
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true)
    
    // Check for existing user in localStorage first (for immediate UI)
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const currentUser = getCurrentUser()
    const sessionToken = getSessionToken()
    
    console.log('Auth context init:', { currentUser, hasSessionToken: !!sessionToken })
    
    if (currentUser) {
      setUser(currentUser)
      setIsLoading(false) // Set loading to false immediately if we have user in localStorage
    }

    // Then fetch full profile from API if we have a session token
    if (sessionToken) {
      fetchUserProfile()
    } else {
      setIsLoading(false)
    }

    // Listen for storage changes (e.g., when user signs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sb-user') {
        const updatedUser = e.newValue ? JSON.parse(e.newValue) : null
        console.log('Storage change detected:', updatedUser)
        setUser(updatedUser)
        if (updatedUser) {
          // Refresh profile to get latest role/company info
          fetchUserProfile()
        }
      }
    }

    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = () => {
      const updatedUser = getCurrentUser()
      console.log('Custom storage event, updated user:', updatedUser)
      if (updatedUser) {
        setUser(updatedUser)
        fetchUserProfile()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('user-updated', handleCustomStorageChange)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('user-updated', handleCustomStorageChange)
      }
    }
  }, [fetchUserProfile])

  const handleSignOut = async () => {
    await signOutUser()
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchUserProfile()
  }

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, isLoading: true, signOut: handleSignOut, refreshUser }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Export function to update user (for use in sign in/sign up pages)
export function useAuthUpdate() {
  return {
    updateUser: (user: User | null) => {
      console.log('Updating user:', user)
      // Update localStorage and trigger storage event to update context
      if (typeof window === 'undefined') return
      
      if (user) {
        localStorage.setItem('sb-user', JSON.stringify(user))
        // Dispatch custom event to update context in same tab
        window.dispatchEvent(new CustomEvent('user-updated'))
        // Also dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sb-user',
          newValue: JSON.stringify(user),
          storageArea: localStorage
        }))
      } else {
        localStorage.removeItem('sb-user')
        window.dispatchEvent(new CustomEvent('user-updated'))
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sb-user',
          newValue: null,
          storageArea: localStorage
        }))
      }
    }
  }
}
