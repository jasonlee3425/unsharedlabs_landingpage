import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isSuperAdmin } from '@backend/lib/auth-helper'
import {
  getOnboardingState,
  updateOnboardingState,
  type OnboardingState,
} from '@backend/services/onboarding.service'

/**
 * GET /api/companies/[companyId]/onboarding
 * Get company onboarding state
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

    // Check company access (super admins can access any company)
    if (!isSuperAdmin(authResult.user.profile) && !hasCompanyAccess(authResult.user.profile, params.companyId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this company' },
        { status: 403 }
      )
    }

    // Get onboarding state using service
    const { data: onboardingRecord, error } = await getOnboardingState(params.companyId)

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      )
    }

    if (!onboardingRecord) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch onboarding state' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        state: onboardingRecord.state,
        completed: onboardingRecord.completed,
        completed_at: onboardingRecord.completed_at,
        updated_at: onboardingRecord.updated_at,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get company onboarding error:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

/**
 * PUT /api/companies/[companyId]/onboarding
 * Upsert onboarding state (company member)
 */
export async function PUT(
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

    // Check company access (super admins can access any company)
    if (!isSuperAdmin(authResult.user.profile) && !hasCompanyAccess(authResult.user.profile, params.companyId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this company' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const incomingState: OnboardingState | undefined = body?.state

    if (!incomingState || typeof incomingState !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload. Expected { state }' }, { status: 400 })
    }

    // Update onboarding state using service
    const { data: updatedRecord, error } = await updateOnboardingState(
      params.companyId,
      incomingState,
      body?.completed
    )

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      )
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, error: 'Failed to update onboarding state' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        state: updatedRecord.state,
        completed: updatedRecord.completed,
        completed_at: updatedRecord.completed_at,
        updated_at: updatedRecord.updated_at,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update company onboarding error:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

