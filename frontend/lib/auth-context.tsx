'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, getSessionToken, signOut as signOutUser } from './auth'

interface User {
  id: string
  email: string
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

  const fetchUserProfile = async () => {
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
          localStorage.setItem('sb-user', JSON.stringify(data.user))
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
  }

  useEffect(() => {
    // Check for existing user in localStorage first (for immediate UI)
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }

    // Then fetch full profile from API
    fetchUserProfile()

    // Listen for storage changes (e.g., when user signs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sb-user') {
        const updatedUser = e.newValue ? JSON.parse(e.newValue) : null
        setUser(updatedUser)
        if (updatedUser) {
          // Refresh profile to get latest role/company info
          fetchUserProfile()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchUserProfile()
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
      // Update localStorage and trigger storage event to update context
      if (user) {
        localStorage.setItem('sb-user', JSON.stringify(user))
        // Dispatch storage event to update all contexts
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sb-user',
          newValue: JSON.stringify(user),
          storageArea: localStorage
        }))
      } else {
        localStorage.removeItem('sb-user')
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sb-user',
          newValue: null,
          storageArea: localStorage
        }))
      }
    }
  }
}
