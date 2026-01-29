import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@backend/services/auth.service'
import { supabaseAdmin } from '@backend/lib/supabase'

const EMAIL_SERVICE_URL = 'https://emailservice.unsharedlabs.com/api'

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
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Get session token
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
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    const { profile } = await getUserProfile(user.id)

    if (!profile || profile.company_id !== companyId || profile.company_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Call email service to create sender
    const emailServiceResponse = await fetch(`${EMAIL_SERVICE_URL}/senders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    })

    const emailServiceData = await emailServiceResponse.json()

    if (!emailServiceResponse.ok || !emailServiceData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailServiceData.error || emailServiceData.message || 'Failed to create sender' 
        },
        { status: emailServiceResponse.status || 500 }
      )
    }

    // Save verification settings to database
    const { data: verificationSettings, error: dbError } = await supabaseAdmin
      .from('company_verification_settings')
      .upsert({
        company_id: companyId,
        sender_email: email,
        sender_name: name,
        sender_id: emailServiceData.data.id.toString(),
        is_verified: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving verification settings:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to save verification settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        senderId: emailServiceData.data.id,
        spfError: emailServiceData.data.spfError,
        dkimError: emailServiceData.data.dkimError
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
 * POST /api/companies/[companyId]/verification/validate
 * Validate OTP code
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { otp } = body

    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'OTP is required' },
        { status: 400 }
      )
    }

    // Get session token
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
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    const { profile } = await getUserProfile(user.id)

    if (!profile || profile.company_id !== companyId || profile.company_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get verification settings to get sender_id
    const { data: verificationSettings, error: fetchError } = await supabase
      .from('company_verification_settings')
      .select('sender_id')
      .eq('company_id', companyId)
      .single()

    if (fetchError || !verificationSettings || !verificationSettings.sender_id) {
      return NextResponse.json(
        { success: false, error: 'Verification settings not found. Please create sender first.' },
        { status: 400 }
      )
    }

    // Call email service to validate OTP
    const emailServiceResponse = await fetch(`${EMAIL_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: otp,
        sender_id: verificationSettings.sender_id
      }),
    })

    const emailServiceData = await emailServiceResponse.json()

    if (!emailServiceData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailServiceData.error || emailServiceData.data?.message || 'Invalid OTP' 
        },
        { status: 400 }
      )
    }

    // Update verification settings to mark as verified
    const { error: updateError } = await supabaseAdmin
      .from('company_verification_settings')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)

    if (updateError) {
      console.error('Error updating verification status:', updateError)
      // Don't fail the request, OTP was validated successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Account verification successful'
    })
  } catch (error: any) {
    console.error('Error in PUT /api/companies/[companyId]/verification/validate:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
