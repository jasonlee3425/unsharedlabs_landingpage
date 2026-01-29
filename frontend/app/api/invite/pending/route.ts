import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/invite/pending
 * Get pending invitations for the current user's email
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                        request.cookies.get('sb-access-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    // Use SUPABASE_API_KEY as service role key to bypass RLS for this query since we're checking email match ourselves
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseServiceKey || supabaseAnonKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    // Use service role key if available to bypass RLS, but still use user's session for auth
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user's email from profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, company_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const normalizedEmail = userProfile.email.toLowerCase().trim()

    // Get pending invitations with filters
    const now = new Date().toISOString()
    const { data: invitations, error: invitationsError } = await supabase
      .from('company_invitations')
      .select('id, token, email, role, company_role, created_at, expires_at, company_id, companies(name)')
      .eq('email', normalizedEmail)
      .is('accepted_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { success: false, error: invitationsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
    })
  } catch (error: any) {
    console.error('Get pending invitations error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
