import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest, hasCompanyAccess, isSuperAdmin } from '@backend/lib/auth-helper'
import { getCompanyData, isOnboardingComplete } from '@backend/services/data.service'

/**
 * GET /api/companies/[companyId]/data
 * Get current company dashboard data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Check company access (super admins can access any company)
    if (!isSuperAdmin(user.profile) && !hasCompanyAccess(user.profile, params.companyId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this company' },
        { status: 403 }
      )
    }

    // Require completed onboarding before returning dashboard data (super admins bypass)
    if (!isSuperAdmin(user.profile)) {
      const onboardingComplete = await isOnboardingComplete(params.companyId)
      if (!onboardingComplete) {
        return NextResponse.json(
          { success: false, error: 'Onboarding incomplete. Please complete onboarding to view dashboard data.' },
          { status: 403 }
        )
      }
    }

    // Get current company data using service
    const { data: companyData, error: dataError } = await getCompanyData(params.companyId)

    if (dataError) {
      return NextResponse.json(
        { success: false, error: dataError },
        { status: 500 }
      )
    }

    if (!companyData) {
      // No data found
      return NextResponse.json(
        { success: true, data: null, message: 'No data available for this company' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      data: companyData.data,
      version: companyData.version,
      updated_at: companyData.updated_at,
    })
  } catch (error: any) {
    console.error('Get company data error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/companies/[companyId]/data
 * Update company dashboard data (for external system)
 * Requires service role key for authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // For external system updates, we'll use a service role key or API key
    // You can implement your own authentication mechanism here
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || 
                   request.headers.get('x-api-key')

    // TODO: Implement your API key validation here
    // For now, we'll use the service role key as a simple auth mechanism
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    
    if (!apiKey || apiKey !== supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    // Use service role key to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify company exists
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id')
      .eq('id', params.companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data. Must be a JSON object' },
        { status: 400 }
      )
    }

    // Upsert company data (creates if doesn't exist, updates if exists)
    // The trigger will automatically:
    // 1. Save old version to history (if updating)
    // 2. Increment version number
    // 3. Update updated_at timestamp
    const { data: updatedData, error: updateError } = await adminClient
      .from('company_data')
      .upsert({
        company_id: params.companyId,
        data: data,
      }, {
        onConflict: 'company_id'
      })
      .select('id, version, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating company data:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to update company data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Company data updated successfully',
      version: updatedData.version,
      company_id: params.companyId,
    })
  } catch (error: any) {
    console.error('Update company data error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
