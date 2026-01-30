import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { getVerificationSettings, saveVerificationSettings } from '@backend/services/verification.service'

/**
 * GET /api/companies/[companyId]/verification/email-template
 * Get email template for company
 */
export async function GET(
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

    // Get verification settings
    const { data: verificationSettings, error: fetchError } = await getVerificationSettings(companyId)

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailTemplate: verificationSettings?.email_template || null
    })
  } catch (error: any) {
    console.error('Error in GET /api/companies/[companyId]/verification/email-template:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/companies/[companyId]/verification/email-template
 * Save email template for company
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { emailTemplate } = body

    if (emailTemplate === undefined) {
      return NextResponse.json(
        { success: false, error: 'Email template is required' },
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

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Save email template
    const { data: verificationSettings, error: saveError } = await saveVerificationSettings(companyId, {
      email_template: emailTemplate || null
    })

    if (saveError) {
      return NextResponse.json(
        { success: false, error: saveError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailTemplate: verificationSettings?.email_template || null
    })
  } catch (error: any) {
    console.error('Error in PUT /api/companies/[companyId]/verification/email-template:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
