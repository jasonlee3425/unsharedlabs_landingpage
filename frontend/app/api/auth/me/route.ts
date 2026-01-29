import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile } from '@backend/services/auth.service'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@backend/lib/supabase'

/**
 * Get current user profile with role and company info
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                        request.cookies.get('sb-access-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create Supabase client with user's session
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('⚠️ Supabase configuration missing in /api/auth/me')
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Ensure email is available - Supabase users should always have an email
    if (!user.email) {
      console.error('User object missing email:', { userId: user.id, email: user.email })
    }

    // Get user profile using admin client to bypass RLS
    // We already verified the user's session, so it's safe to use admin client
    let profile, company
    if (supabaseAdmin) {
      // Use admin client for profile lookup (bypasses RLS)
      try {
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError)
          return NextResponse.json(
            { success: false, error: 'User profile not found' },
            { status: 404 }
          )
        }

        profile = profileData

        // Get company if user has one
        if (profile.company_id) {
          const { data: companyData, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()

          if (!companyError && companyData) {
            company = companyData
          }
        }
      } catch (err) {
        console.error('Error in getUserProfile:', err)
        return NextResponse.json(
          { success: false, error: 'Error fetching user profile' },
          { status: 500 }
        )
      }
    } else {
      // Fallback to regular getUserProfile if admin client not available
      const result = await getUserProfile(user.id)
      profile = result.profile
      company = result.company
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get name from user metadata
    const userName = user.user_metadata?.name || 
                     user.user_metadata?.full_name || 
                     user.user_metadata?.display_name ||
                     undefined

    // Ensure we always return a valid email - fallback to profile email if auth email is missing
    const userEmail = user.email || profile.email || ''
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: userEmail,
        name: userName,
        role: profile.role,
        companyId: profile.company_id || undefined,
        companyName: company?.name || undefined,
      },
    })
  } catch (error: any) {
    console.error('Get user profile error:', {
      message: error.message,
      stack: error.stack,
      error: error
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
