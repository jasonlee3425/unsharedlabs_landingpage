import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { getVerificationSettings } from '@backend/services/verification.service'

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

    // Verify BREVO_API_KEY is configured
    const brevoApiKey = process.env.BREVO_API_KEY
    if (!brevoApiKey) {
      console.error('❌ BREVO_API_KEY not configured in environment variables')
      return NextResponse.json(
        { success: false, error: 'Email service configuration error. BREVO_API_KEY is not set.' },
        { status: 500 }
      )
    }

    try {
      // Call Brevo API to authenticate domain
      // Endpoint: PUT https://api.brevo.com/v3/senders/domains/{domainName}/authenticate
      const domainName = encodeURIComponent(verificationSettings.domain)
      const brevoResponse = await fetch(`https://api.brevo.com/v3/senders/domains/${domainName}/authenticate`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
        },
      })

      const brevoData = await brevoResponse.json()

      if (!brevoResponse.ok) {
        console.error('❌ Brevo API error:', {
          status: brevoResponse.status,
          statusText: brevoResponse.statusText,
          error: brevoData,
        })
        
        let errorMessage = 'Failed to authenticate domain'
        if (brevoData.message) {
          errorMessage = brevoData.message
        } else if (brevoResponse.status === 404) {
          errorMessage = 'Domain does not exist in Brevo'
        } else if (brevoResponse.status === 400) {
          errorMessage = brevoData.message || 'Bad request. DNS records may not be configured correctly.'
        } else if (brevoResponse.status === 401) {
          errorMessage = 'Invalid Brevo API key'
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage
          },
          { status: brevoResponse.status }
        )
      }

      console.log('✅ Domain authentication successful:', {
        domain: brevoData.domain_name,
        message: brevoData.message
      })

      return NextResponse.json({
        success: true,
        message: brevoData.message || 'Domain authenticated successfully',
        data: {
          domain_name: brevoData.domain_name,
        }
      })
    } catch (brevoError: any) {
      console.error('❌ Error calling Brevo API:', brevoError)
      return NextResponse.json(
        { 
          success: false, 
          error: brevoError.message || 'Failed to communicate with email service' 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in PUT /api/companies/[companyId]/verification/domain/authenticate:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
