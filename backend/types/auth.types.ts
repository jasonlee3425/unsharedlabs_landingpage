/**
 * Authentication types and interfaces
 */

export type UserRole = 'super_admin' | 'client'

export interface SignUpRequest {
  email: string
  password: string
  companyName?: string // Optional: for client signups
}

export interface SignInRequest {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    role?: UserRole
    companyId?: string
    companyName?: string
  }
  session?: {
    access_token: string
    refresh_token: string
  }
}

export interface User {
  id: string
  email: string
  role?: UserRole
  companyId?: string
  companyName?: string
  created_at?: string
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  role: UserRole
  company_id: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}
