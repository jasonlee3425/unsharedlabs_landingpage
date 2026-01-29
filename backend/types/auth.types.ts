/**
 * Authentication types and interfaces
 */

export type UserRole = 'super_admin' | 'client'

export interface SignUpRequest {
  email: string
  password: string
  name?: string // Optional: user's display name
  companyName?: string // Optional: for client signups
  inviteToken?: string // Optional: invitation token if signing up via invite
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
    name?: string
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
  name?: string
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
  company_role?: 'admin' | 'member' | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}
