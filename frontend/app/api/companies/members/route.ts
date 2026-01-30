import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInviteEmail } from '@backend/services/email.service'
import { randomBytes } from 'crypto'

/**
 * GET /api/companies/members
 * Get all members of the user's company
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
    // Use SUPABASE_API_KEY as service role key
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseAnonKey || supabaseServiceKey

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    if (!supabaseAnonKey && supabaseServiceKey) {
      console.warn('⚠️ Using SUPABASE_API_KEY instead of SUPABASE_ANON_KEY for companies/members API')
    }

    // Create client for user auth operations
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    // Create admin client for bypassing RLS when fetching company members
    const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user's profile to find their company_id
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', {
        error: profileError,
        code: profileError.code,
        message: profileError.message,
        userId: user.id
      })
      return NextResponse.json(
        { success: false, error: profileError.message || 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!userProfile) {
      console.error('User profile not found:', user.id)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to a company' },
        { status: 404 }
      )
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, logo_url, website_url, created_at')
      .eq('id', userProfile.company_id)
      .single()

    if (companyError) {
      console.error('Error fetching company:', {
        error: companyError,
        code: companyError.code,
        message: companyError.message,
        details: companyError.details,
        hint: companyError.hint,
        companyId: userProfile.company_id
      })
      return NextResponse.json(
        { success: false, error: companyError.message || 'Failed to fetch company' },
        { status: 500 }
      )
    }

    if (!company) {
      console.error('Company not found:', userProfile.company_id)
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get all members of the same company
    // Use admin client (service role key) to bypass RLS since we've already verified the user belongs to this company
    // This is necessary because RLS only allows users to see their own profile, not other company members
    const membersClient = adminClient || supabase

    // Try to fetch members with name field, but handle gracefully if it doesn't exist yet
    let members, membersError
    try {
      const result = await membersClient
        .from('user_profiles')
        .select('id, user_id, email, role, company_id, company_role, name, created_at')
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: true })
      members = result.data
      membersError = result.error
    } catch (err: any) {
      // If name column doesn't exist, try without it
      if (err?.message?.includes('name') || err?.code === '42703') {
        console.warn('⚠️ name column not found, fetching without it')
        const result = await membersClient
          .from('user_profiles')
          .select('id, user_id, email, role, company_id, company_role, created_at')
          .eq('company_id', userProfile.company_id)
          .order('created_at', { ascending: true })
        members = result.data
        membersError = result.error
      } else {
        membersError = err
      }
    }

    if (membersError) {
      console.error('Error fetching company members:', {
        error: membersError,
        code: membersError.code,
        message: membersError.message,
        details: membersError.details,
        hint: membersError.hint,
        companyId: userProfile.company_id,
        usingAdminClient: !!adminClient
      })
      return NextResponse.json(
        { success: false, error: membersError.message || 'Failed to fetch company members' },
        { status: 500 }
      )
    }

    console.log('Fetched company members:', {
      companyId: userProfile.company_id,
      memberCount: members?.length || 0,
      usingAdminClient: !!adminClient
    })

    // Get pending invitations for this company
    const { data: invitations, error: invitationsError } = await supabase
      .from('company_invitations')
      .select('id, email, role, company_role, created_at, expires_at')
      .eq('company_id', userProfile.company_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Don't fail if invitations query fails - just log it
    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
    }

    return NextResponse.json({
      success: true,
      company: company,
      members: members || [],
      invitations: invitations || [],
    })
  } catch (error: any) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/companies/members
 * Invite a new member to the company
 */
export async function POST(request: NextRequest) {
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
    // Use SUPABASE_API_KEY as service role key
    const supabaseKey = supabaseAnonKey || process.env.SUPABASE_API_KEY
    const supabaseServiceKey = process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        url: supabaseUrl ? 'SET' : 'MISSING',
        anonKey: supabaseAnonKey ? 'SET' : 'MISSING',
        serviceKey: supabaseServiceKey ? 'SET' : 'MISSING'
      })
      return NextResponse.json(
        { 
          success: false, 
          error: `Configuration error: Missing ${!supabaseUrl ? 'SUPABASE_URL' : 'Supabase API key (SUPABASE_ANON_KEY or SUPABASE_API_KEY)'}` 
        },
        { status: 500 }
      )
    }

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

    // Check if user is admin (for now, check if they have a company - later we'll add proper admin check)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || !userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'You must create a company first' },
        { status: 403 }
      )
    }

    // Check if user is a company admin (only admins can invite)
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('company_role')
      .eq('user_id', user.id)
      .single()

    if (currentUserProfile?.company_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only company admins can invite members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, company_role } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate company_role
    const validCompanyRole = company_role === 'admin' ? 'admin' : 'member'

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists and is already a member
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, company_id')
      .eq('email', normalizedEmail)
      .single()

    if (existingProfile && existingProfile.company_id === userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this company' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const inviteToken = randomBytes(32).toString('hex')

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', userProfile.company_id)
      .single()

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get inviter's display name (prefer name field, fallback to email)
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single()

    const inviterDisplayName = inviterProfile?.name || inviterProfile?.email || 'Someone'

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('company_invitations')
      .insert({
        company_id: userProfile.company_id,
        email: normalizedEmail,
        role: 'client', // Global role - always 'client' for company members
        company_role: validCompanyRole, // Company-specific role: 'admin' or 'member'
        token: inviteToken,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { success: false, error: inviteError.message || 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send invitation email
    const emailResult = await sendInviteEmail({
      to: normalizedEmail,
      inviterDisplayName,
      companyName: company.name,
      inviteToken,
      role: validCompanyRole === 'admin' ? 'Admin' : 'Member',
    })

    if (!emailResult.success) {
      // Delete invitation if email failed
      await supabase
        .from('company_invitations')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    })
  } catch (error: any) {
    console.error('Invite member error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
