import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import {
  createSender,
  validateOtp,
  getVerificationSettings,
  saveVerificationSettings,
  updatePreventionStep,
} from '@backend/services/verification.service'

/**
 * GET /api/companies/[companyId]/verification
 * Get verification settings for a company
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
    
    // TypeScript now knows authResult.success is true
    const { user } = authResult

    // Check company access
    if (!hasCompanyAccess(user.profile, companyId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get verification settings using service
    const { data: verificationSettings, error: fetchError } = await getVerificationSettings(companyId)

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: verificationSettings
    })
  } catch (error: any) {
    console.error('Error in GET /api/companies/[companyId]/verification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/companies/[companyId]/verification/sender
 * Create a sender in the email service
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { email, name, updateMode } = body

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
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
    
    // TypeScript now knows authResult.success is true
    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Create sender using verification service
    const senderResult = await createSender({ email, name })

    if (!senderResult.success || !senderResult.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: senderResult.error || 'Failed to create sender' 
        },
        { status: 500 }
      )
    }

    // Get existing settings to preserve is_verified status
    const { data: existingSettings } = await getVerificationSettings(companyId)

    // Save verification settings using service
    // In update mode, only save sender_id (email/name will be saved after OTP validation)
    // In create mode, save everything
    const settingsToSave: any = {
      sender_id: senderResult.data.id.toString(),
      is_verified: existingSettings?.is_verified || false,
    }
    
    if (!updateMode) {
      // Initial flow: save email/name immediately
      settingsToSave.sender_email = email
      settingsToSave.sender_name = name
    } else {
      // Update flow: preserve existing email/name, only update sender_id
      // Email/name will be updated after OTP validation
      if (existingSettings?.sender_email) {
        settingsToSave.sender_email = existingSettings.sender_email
      }
      if (existingSettings?.sender_name) {
        settingsToSave.sender_name = existingSettings.sender_name
      }
    }

    const { data: verificationSettings, error: dbError } = await saveVerificationSettings(companyId, settingsToSave)

    if (dbError) {
      return NextResponse.json(
        { success: false, error: dbError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        senderId: senderResult.data.id,
        spfError: senderResult.data.spfError,
        dkimError: senderResult.data.dkimError
      }
    })
  } catch (error: any) {
    console.error('Error in POST /api/companies/[companyId]/verification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/companies/[companyId]/verification/validate
 * Validate OTP code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { otp, email, name } = body

    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'OTP is required' },
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
    
    // TypeScript now knows authResult.success is true
    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get verification settings to get sender_id
    const { data: verificationSettings, error: fetchError } = await getVerificationSettings(companyId)

    if (fetchError || !verificationSettings || !verificationSettings.sender_id) {
      return NextResponse.json(
        { success: false, error: 'Verification settings not found. Please create sender first.' },
        { status: 400 }
      )
    }

    // Validate OTP using verification service
    const validateResult = await validateOtp({
      otp,
      senderId: Number(verificationSettings.sender_id),
    })

    if (!validateResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validateResult.error || 'Invalid OTP' 
        },
        { status: 400 }
      )
    }

    // Update verification settings to mark as verified (step 1 complete)
    // If email and name are provided (update flow), update them as well
    // Otherwise, preserve existing email/name from verification settings
    const updateData: any = {
      is_verified: true,
    }
    
    if (email && name) {
      // Update flow: use the new email and name
      updateData.sender_email = email
      updateData.sender_name = name
    } else {
      // Initial flow: preserve existing email/name from verification settings
      // They should already be saved when sender was created
      if (verificationSettings.sender_email) {
        updateData.sender_email = verificationSettings.sender_email
      }
      if (verificationSettings.sender_name) {
        updateData.sender_name = verificationSettings.sender_name
      }
    }

    const { error: updateError } = await saveVerificationSettings(companyId, updateData)

    if (updateError) {
      console.error('Error updating verification status:', updateError)
      // Don't fail the request, OTP was validated successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Account verification successful'
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/companies/[companyId]/verification/validate:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/companies/[companyId]/verification/steps
 * Mark a prevention step as complete
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { step } = body

    if (!step || (step !== 2 && step !== 3)) {
      return NextResponse.json(
        { success: false, error: 'Step must be 2 or 3' },
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
    
    // TypeScript now knows authResult.success is true
    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Update prevention step using service
    const result = await updatePreventionStep(companyId, step)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('Please complete') ? 400 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Step ${step} marked as complete`
    })
  } catch (error: any) {
    console.error('Error in PUT /api/companies/[companyId]/verification/steps:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
