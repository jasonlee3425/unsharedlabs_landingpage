import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/invite/accept
 * Accept a company invitation
 */
export async function POST(request: NextRequest) {
  console.log('=== Accept Invitation API Called ===')
  
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                        request.cookies.get('sb-access-token')?.value

    console.log('1. Session token present:', !!sessionToken)

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. Please sign in first.' },
        { status: 401 }
      )
    }

    // Use same pattern as /api/invite/pending and /api/companies/members
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    // Use SUPABASE_API_KEY as service role key
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseAnonKey || supabaseServiceKey

    console.log('2. Config check:', { 
      hasUrl: !!supabaseUrl, 
      hasAnonKey: !!supabaseAnonKey, 
      hasServiceKey: !!supabaseServiceKey,
      usingKey: supabaseAnonKey ? 'anon' : (supabaseServiceKey ? 'service' : 'none')
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error('2. Configuration error - missing:', {
        url: !supabaseUrl,
        key: !supabaseKey
      })
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    if (!supabaseAnonKey && supabaseServiceKey) {
      console.warn('⚠️ Using service role key instead of anon key for invite/accept API')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    console.log('3. Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('4. User error:', userError)
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    console.log('4. User found:', user.id)

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('5. Error parsing request body:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { token } = body
    console.log('5. Token from body:', token ? 'present' : 'missing')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Get invitation by token
    console.log('6. Fetching invitation...')
    const { data: invitation, error: inviteError } = await supabase
      .from('company_invitations')
      .select('*, companies(name)')
      .eq('token', token)
      .single()

    if (inviteError) {
      console.error('6. Error fetching invitation:', {
        error: inviteError,
        message: inviteError.message,
        details: inviteError.details,
        hint: inviteError.hint,
        code: inviteError.code
      })
      return NextResponse.json(
        { success: false, error: inviteError.message || 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    if (!invitation) {
      console.log('6. No invitation found')
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    console.log('6. Invitation found:', { 
      id: invitation.id, 
      email: invitation.email,
      company_id: invitation.company_id,
      expires_at: invitation.expires_at,
      accepted_at: invitation.accepted_at
    })

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log('7. Invitation expired')
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      console.log('7. Invitation already accepted')
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    console.log('7. Invitation valid, getting user profile...')

    // Get user's email from profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('8. Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: profileError.message || 'User profile not found' },
        { status: 404 }
      )
    }

    if (!userProfile) {
      console.log('8. User profile not found')
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('8. User profile email:', userProfile.email)
    console.log('8. Invitation email:', invitation.email)

    // Verify email matches invitation
    if (userProfile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      console.log('9. Email mismatch')
      return NextResponse.json(
        { success: false, error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    console.log('9. Email matches, proceeding with update...')

    // Check if user already belongs to a company
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    console.log('10. Existing company_id:', existingProfile?.company_id || 'none')

    // Try updating with the user's authenticated session first (respects RLS)
    // Users can update their own profile according to RLS policies
    let updatedProfile, updateError
    
    console.log('11. Attempting profile update with user session...')
    console.log('11. Update data:', { company_id: invitation.company_id, role: invitation.role })
    
    const { data: profileUpdate, error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        company_id: invitation.company_id,
        role: invitation.role,
        company_role: invitation.company_role || 'member', // Set company_role from invitation, default to 'member'
      })
      .eq('user_id', user.id)
      .select()
      .single()

    console.log('11. Profile update result:', { data: profileUpdate, error: profileUpdateError?.message })

    updatedProfile = profileUpdate
    updateError = profileUpdateError

    // If update fails due to RLS, try with service role key as fallback
    if (updateError && supabaseServiceKey) {
      console.log('Update with user session failed, trying with service role key:', updateError.message)
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: adminUpdate, error: adminError } = await adminClient
        .from('user_profiles')
        .update({
          company_id: invitation.company_id,
          role: invitation.role,
          company_role: invitation.company_role || 'member', // Set company_role from invitation, default to 'member'
        })
        .eq('user_id', user.id)
        .select()
        .single()

      updatedProfile = adminUpdate
      updateError = adminError
    }

    if (updateError) {
      console.error('Error updating user profile:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        userId: user.id,
        companyId: invitation.company_id,
        role: invitation.role
      })
      
      // Provide more helpful error messages
      if (updateError.code === '42501' || updateError.message?.includes('permission') || updateError.message?.includes('policy')) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please ensure you have the correct permissions to join this company.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to join company' },
        { status: 500 }
      )
    }

    if (!updatedProfile) {
      console.error('Profile update returned no data:', { userId: user.id })
      return NextResponse.json(
        { success: false, error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    console.log('Successfully updated user profile:', {
      userId: user.id,
      companyId: updatedProfile.company_id,
      role: updatedProfile.role
    })

    // Verify the update by fetching the profile again
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (verifyError || !verifiedProfile) {
      console.error('Error verifying profile update:', verifyError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify profile update' },
        { status: 500 }
      )
    }

    if (verifiedProfile.company_id !== invitation.company_id) {
      console.error('Profile update verification failed:', {
        expected: invitation.company_id,
        actual: verifiedProfile.company_id
      })
      return NextResponse.json(
        { success: false, error: 'Profile update verification failed' },
        { status: 500 }
      )
    }

    // Mark invitation as accepted - use service role if available, otherwise try with user session
    let acceptError
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      const { error } = await adminClient
        .from('company_invitations')
        .update({
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
      acceptError = error
    } else {
      // Try with user session - might fail if RLS doesn't allow, but that's okay
      const { error } = await supabase
        .from('company_invitations')
        .update({
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .eq('email', userProfile.email.toLowerCase())
      acceptError = error
    }

    if (acceptError) {
      console.error('Error marking invitation as accepted:', acceptError)
      // Don't fail if this fails - user is already added to company
    }

    // Get company name for response
    let companyName = null
    if (invitation.companies && typeof invitation.companies === 'object') {
      companyName = invitation.companies.name
    } else {
      // Fallback: fetch company name directly
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invitation.company_id)
        .single()
      companyName = company?.name || null
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      company: companyName ? { name: companyName } : null,
      user: {
        companyId: verifiedProfile.company_id,
        role: verifiedProfile.role
      }
    })
  } catch (error: any) {
    console.error('Accept invitation error:', {
      message: error.message,
      stack: error.stack,
      error: error,
      name: error.name
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
