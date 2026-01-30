import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { getVerificationSettings, authenticateBrevoDomain } from '@backend/services/verification.service'

/**
 * PUT /api/companies/[companyId]/verification/domain/authenticate
 * Authenticate domain with Brevo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

    // Authenticate request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get verification settings to find the domain
    const { data: verificationSettings, error: fetchError } = await getVerificationSettings(companyId)

    if (fetchError || !verificationSettings || !verificationSettings.domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not configured. Please set up domain first.' },
        { status: 400 }
      )
    }

    // Authenticate domain using backend service
    const authResult = await authenticateBrevoDomain(verificationSettings.domain)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 500 }
      )
    }

    const brevoData = authResult.data!

    return NextResponse.json({
      success: true,
      message: brevoData.message || 'Domain authenticated successfully',
      data: {
        domain_name: brevoData.domain_name,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
