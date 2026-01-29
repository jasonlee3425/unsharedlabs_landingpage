/**
 * Authentication helper for API routes
 * Provides reusable functions for authenticating requests and checking permissions
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '../services/auth.service'
import type { UserProfile } from '../types/auth.types'

export interface AuthenticatedUser {
  user: { id: string; email: string | undefined }
  profile: UserProfile
  supabase: ReturnType<typeof createClient>
}

export type AuthResult =
  | {
      success: true
      user: AuthenticatedUser
    }
  | {
      success: false
      error: string
      status: number
    }

/**
 * Authenticate a request and return user information
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get session token
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                        request.cookies.get('sb-access-token')?.value

    if (!sessionToken) {
      return {
        success: false,
        error: 'Not authenticated',
        status: 401
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Configuration error',
        status: 500
      }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Invalid session',
        status: 401
      }
    }

    const { profile } = await getUserProfile(user.id)

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
        status: 404
      }
    }

    return {
      success: true,
      user: {
        user: {
          id: user.id,
          email: user.email
        },
        profile,
        supabase
      }
    }
  } catch (error: any) {
    console.error('Error authenticating request:', error)
    return {
      success: false,
      error: error.message || 'Authentication error',
      status: 500
    }
  }
}

/**
 * Check if user has access to a specific company
 */
export function hasCompanyAccess(
  profile: UserProfile,
  companyId: string
): boolean {
  // Super admins have access to all companies
  if (profile.role === 'super_admin') {
    return true
  }

  // Regular users can only access their own company
  return profile.company_id === companyId
}

/**
 * Check if user is a company admin
 */
export function isCompanyAdmin(profile: UserProfile): boolean {
  return profile.company_role === 'admin'
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(profile: UserProfile): boolean {
  return profile.role === 'super_admin'
}
