import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { updateCompany } from '@backend/services/company.service'

/**
 * GET /api/companies/[companyId]
 * Get company details
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

    // Check company access
    if (!hasCompanyAccess(user.profile, companyId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Use the authenticated Supabase client from auth helper
    const { data: company, error } = await user.supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error: any) {
    console.error('Error in GET /api/companies/[companyId]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/companies/[companyId]
 * Update company (only company admins can update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { name, website_url } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
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

    // Use the authenticated Supabase client from auth helper
    // Update company using service
    const { company, error: updateError } = await updateCompany(user.supabase, companyId, name, website_url)

    if (updateError || !company) {
      return NextResponse.json(
        { success: false, error: updateError || 'Failed to update company' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/companies/[companyId]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
