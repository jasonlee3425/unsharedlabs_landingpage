/**
 * Authentication service
 * Handles all authentication logic including Supabase operations
 */

import { supabase, supabaseAdmin } from '../lib/supabase'
import type { SignUpRequest, SignInRequest, AuthResponse, UserProfile, Company } from '../types/auth.types'

/**
 * Get user profile with role and company information
 */
export async function getUserProfile(userId: string): Promise<{ profile: UserProfile | null; company: Company | null }> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return { profile: null, company: null }
    }

    // Get company if user has one
    let company: Company | null = null
    if (profile.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()

      if (!companyError && companyData) {
        company = companyData
      }
    }

    return { profile, company }
  } catch (err) {
    console.error('Error fetching user profile:', err)
    return { profile: null, company: null }
  }
}

/**
 * Sign up a new user
 * Uses regular Supabase Auth signup which sends confirmation email via custom SMTP (Brevo)
 * User must confirm email before signing in
 */
export async function signUp({ email, password, name, companyName, inviteToken }: SignUpRequest): Promise<AuthResponse> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL
    const hasApiKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
    
    if (!supabaseUrl || !hasApiKey) {
      console.error('⚠️ Supabase environment variables missing!')
      return { 
        success: false, 
        error: 'Server configuration error. Please contact support.' 
      }
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Step 1: Create user in Supabase Auth
    // This will send a confirmation email via your custom SMTP (Brevo)
    const redirectUrl = inviteToken 
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?invite=${inviteToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: name ? {
          // Store name in user metadata
          name: name,
          full_name: name,
          ...(inviteToken ? { invite_token: inviteToken } : {}),
        } : (inviteToken ? { invite_token: inviteToken } : undefined),
      },
    })
    
    // Update the user's display name if name is provided (using admin API)
    if (name && data.user && supabaseAdmin) {
      try {
        // Use admin client to update user metadata and set display name
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          user_metadata: {
            name: name,
            full_name: name,
          },
        })
      } catch (updateError) {
        console.error('Error updating user name:', updateError)
        // Don't fail signup if name update fails - metadata might already be set
      }
    }

    if (error) {
      console.error('Supabase signup error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      
      // Handle network/fetch errors
      if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Unable to connect to authentication service. Please check your internet connection and try again.' 
        }
      }
      
      // Handle duplicate user error
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' }
      }
      
      // Handle email sending errors
      if (error.message.includes('email') || error.message.includes('confirmation') || error.message.includes('invite')) {
        return { success: false, error: 'Email confirmation error' }
      }
      
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Step 2: Handle company (if provided, but skip if there's an invite token - invite will handle company assignment)
    // Use admin client to bypass RLS if needed
    const adminClient = supabaseAdmin || supabase
    let companyId: string | null = null
    // Don't create/assign company if there's an invite token - the invite acceptance will handle it
    if (companyName && companyName.trim() && !inviteToken) {
      // Try to find existing company
      const { data: existingCompany } = await adminClient
        .from('companies')
        .select('id')
        .eq('name', companyName.trim())
        .single()

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await adminClient
          .from('companies')
          .insert({ name: companyName.trim() })
          .select('id')
          .single()

        if (!companyError && newCompany) {
          companyId = newCompany.id
        }
      }
    }

    // Step 3: Create user profile
    // Use admin client to bypass RLS for profile creation
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        email: normalizedEmail,
        role: 'client',
        company_id: companyId,
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // User is created in auth, but profile failed
      // This is okay - user can still confirm email and we can handle profile later
    }

    // Success - user created, confirmation email sent via Brevo SMTP
    // User must confirm email before signing in
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        name: name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || undefined,
        role: 'client',
        companyId: companyId || undefined,
      },
      // Session will be null until email is confirmed
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      } : undefined,
    }
  } catch (err: any) {
    console.error('Sign up error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInRequest): Promise<AuthResponse> {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      // Provide more helpful error messages
      if (error.message.includes('Invalid login credentials')) {
        return { 
          success: false, 
          error: 'Invalid email or password. If you haven\'t signed up yet, please create an account first.' 
        }
      }
      if (error.message.includes('Email not confirmed')) {
        return { 
          success: false, 
          error: 'Please check your email and click the confirmation link before signing in.' 
        }
      }
      return { success: false, error: error.message }
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Failed to create session. Please try again.' }
    }

    // Fetch user profile with role and company info
    const { profile, company } = await getUserProfile(data.user.id)

    // Get name from user metadata
    const userName = data.user.user_metadata?.name || 
                     data.user.user_metadata?.full_name || 
                     data.user.user_metadata?.display_name ||
                     undefined

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || normalizedEmail,
        name: userName,
        role: profile?.role || 'client',
        companyId: profile?.company_id || undefined,
        companyName: company?.name || undefined,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    }
  } catch (err: any) {
    console.error('Sign in error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(sessionToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Create a client with the user's session token
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Configuration error' }
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    const { error } = await userClient.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Sign out error:', err)
    return { success: false, error: err.message || 'Failed to sign out' }
  }
}
