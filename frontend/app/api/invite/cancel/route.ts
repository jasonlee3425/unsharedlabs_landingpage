import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'

/**
 * DELETE /api/invite/cancel
 * Cancel/delete a pending invitation (only company admins can cancel)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Authenticate request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Get the invitation to find the company_id
    const { data: invitation, error: fetchError } = await user.supabase
      .from('company_invitations')
      .select('company_id')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check company access and admin role
    // User must have access to the company AND be an admin
    if (!hasCompanyAccess(user.profile, invitation.company_id) || !isCompanyAdmin(user.profile)) {
      console.error('Authorization failed:', {
        hasAccess: hasCompanyAccess(user.profile, invitation.company_id),
        isAdmin: isCompanyAdmin(user.profile),
        userCompanyId: user.profile.company_id,
        invitationCompanyId: invitation.company_id,
        userRole: user.profile.company_role
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Delete the invitation
    const { error: deleteError } = await user.supabase
      .from('company_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message || 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/invite/cancel:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
