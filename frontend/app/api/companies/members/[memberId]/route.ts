import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * PATCH /api/companies/members/[memberId]
 * Update a member's display name and/or company role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
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
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
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

    // Check if user belongs to a company
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id, company_role')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || !userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You must belong to a company' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, company_role } = body

    // Validate that at least one field is being updated
    if (name === undefined && company_role === undefined) {
      return NextResponse.json(
        { success: false, error: 'At least one field (name or company_role) must be provided' },
        { status: 400 }
      )
    }

    // Validate company_role if provided
    if (company_role !== undefined && company_role !== 'admin' && company_role !== 'member') {
      return NextResponse.json(
        { success: false, error: 'Invalid company_role. Must be "admin" or "member"' },
        { status: 400 }
      )
    }

    // Use service role key to update (bypasses RLS)
    const adminClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabase

    // Verify the member belongs to the same company and get their current role
    const { data: memberProfile } = await adminClient
      .from('user_profiles')
      .select('company_id, user_id, company_role')
      .eq('id', params.memberId)
      .single()

    if (!memberProfile || memberProfile.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'Member not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Check permissions:
    // - Users can edit their own name
    // - Admins can edit anyone's name and role
    const isEditingSelf = memberProfile.user_id === user.id
    const isAdmin = userProfile.company_role === 'admin'
    
    if (!isEditingSelf && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only company admins can edit other members' },
        { status: 403 }
      )
    }

    // Don't allow non-admins to change roles (even their own)
    if (company_role !== undefined && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only company admins can change roles' },
        { status: 403 }
      )
    }

    // Don't allow demoting the last admin
    if (company_role === 'member' && memberProfile.company_role === 'admin') {
      // Count how many admins exist in this company
      const { count: adminCount } = await adminClient
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)
        .eq('company_role', 'admin')

      if (adminCount === 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot remove the last admin. Promote another member to admin first.' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: { name?: string | null; company_role?: 'admin' | 'member' } = {}
    if (name !== undefined) {
      updateData.name = name?.trim() || null
    }
    if (company_role !== undefined) {
      updateData.company_role = company_role
    }

    // Update member
    const { data: updatedMember, error: updateError } = await adminClient
      .from('user_profiles')
      .update(updateData)
      .eq('id', params.memberId)
      .select('id, name, company_role')
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: updatedMember,
    })
  } catch (error: any) {
    console.error('Update member error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/companies/members/[memberId]
 * Remove a member from the company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
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
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
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

    // Check if user is a company admin (only admins can remove members)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id, company_role')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || !userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You must belong to a company' },
        { status: 403 }
      )
    }

    if (userProfile.company_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only company admins can remove members' },
        { status: 403 }
      )
    }

    // Use service role key
    const adminClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabase

    // Verify the member belongs to the same company
    const { data: memberProfile } = await adminClient
      .from('user_profiles')
      .select('company_id, user_id')
      .eq('id', params.memberId)
      .single()

    if (!memberProfile || memberProfile.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'Member not found or does not belong to your company' },
        { status: 404 }
      )
    }

    // Don't allow removing yourself
    if (memberProfile.user_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove yourself from the company' },
        { status: 400 }
      )
    }

    // Remove member by setting company_id to null
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({ company_id: null })
      .eq('id', params.memberId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
