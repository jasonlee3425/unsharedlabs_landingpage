/**
 * Verification service
 * Handles account verification operations including external email service integration
 */

import { supabaseAdmin } from '../lib/supabase'

const EMAIL_SERVICE_URL = 'https://emailservice.unsharedlabs.com/api'

export interface CreateSenderParams {
  email: string
  name: string
}

export interface CreateSenderResponse {
  success: boolean
  data?: {
    id: number
    spfError: boolean
    dkimError: boolean
  }
  error?: string
}

export interface ValidateOtpParams {
  otp: string
  senderId: number
}

export interface ValidateOtpResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Create a sender in the external email service
 */
export async function createSender({ email, name }: CreateSenderParams): Promise<CreateSenderResponse> {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/senders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to create sender',
      }
    }

    return {
      success: true,
      data: {
        id: data.data.id,
        spfError: data.data.spfError || false,
        dkimError: data.data.dkimError || false,
      },
    }
  } catch (error: any) {
    console.error('Error creating sender:', error)
    return {
      success: false,
      error: error.message || 'Failed to create sender',
    }
  }
}

/**
 * Validate OTP code with external email service
 */
export async function validateOtp({ otp, senderId }: ValidateOtpParams): Promise<ValidateOtpResponse> {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/validate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: otp,
        sender_id: senderId.toString(),
      }),
    })

    const data = await response.json()

    if (!data.success) {
      return {
        success: false,
        error: data.error || data.data?.message || 'Invalid OTP',
      }
    }

    return {
      success: true,
      message: 'OTP validated successfully',
    }
  } catch (error: any) {
    console.error('Error validating OTP:', error)
    return {
      success: false,
      error: error.message || 'Failed to validate OTP',
    }
  }
}

/**
 * Get verification settings for a company
 */
export async function getVerificationSettings(companyId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_verification_settings')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching verification settings:', error)
      return { data: null, error: error.message }
    }

    return { data: data || null, error: null }
  } catch (error: any) {
    console.error('Error in getVerificationSettings:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Save or update verification settings
 */
export async function saveVerificationSettings(
  companyId: string,
  settings: {
    sender_email?: string
    sender_name?: string
    sender_id?: string
    is_verified?: boolean
    prevention_steps?: { step1: boolean; step2: boolean; step3: boolean }
    domain?: string
    domain_brevo_id?: string
    domain_dns_records?: any // JSONB to store all DNS records
    email_template?: string // HTML email template
  }
) {
  try {
    // Get existing settings to preserve values that aren't being updated
    const { data: existingSettings } = await supabaseAdmin
      .from('company_verification_settings')
      .select('*')
      .eq('company_id', companyId)
      .single()

    // Preserve existing prevention_steps or initialize with defaults
    const preventionSteps = settings.prevention_steps || existingSettings?.prevention_steps || { step1: false, step2: false, step3: false }
    
    // If is_verified is being set to true, ensure step1 is also true
    if (settings.is_verified === true) {
      preventionSteps.step1 = true
    } else if (existingSettings?.is_verified) {
      preventionSteps.step1 = true
    }

    // Build the update object, preserving existing values for fields not being updated
    const updateData: any = {
      company_id: companyId,
      prevention_steps: preventionSteps,
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are explicitly provided in settings
    // This allows partial updates without overwriting existing values
    if (settings.sender_email !== undefined) {
      updateData.sender_email = settings.sender_email
    } else if (existingSettings?.sender_email) {
      updateData.sender_email = existingSettings.sender_email
    }

    if (settings.sender_name !== undefined) {
      updateData.sender_name = settings.sender_name
    } else if (existingSettings?.sender_name) {
      updateData.sender_name = existingSettings.sender_name
    }

    if (settings.sender_id !== undefined) {
      updateData.sender_id = settings.sender_id
    } else if (existingSettings?.sender_id) {
      updateData.sender_id = existingSettings.sender_id
    }

    if (settings.is_verified !== undefined) {
      updateData.is_verified = settings.is_verified
    } else if (existingSettings?.is_verified !== undefined) {
      updateData.is_verified = existingSettings.is_verified
    }

    if (settings.domain !== undefined) {
      updateData.domain = settings.domain
    } else if (existingSettings?.domain) {
      updateData.domain = existingSettings.domain
    }

    if (settings.domain_brevo_id !== undefined) {
      updateData.domain_brevo_id = settings.domain_brevo_id
    } else if (existingSettings?.domain_brevo_id) {
      updateData.domain_brevo_id = existingSettings.domain_brevo_id
    }

    if (settings.domain_dns_records !== undefined) {
      updateData.domain_dns_records = settings.domain_dns_records
    } else if (existingSettings?.domain_dns_records) {
      updateData.domain_dns_records = existingSettings.domain_dns_records
    }

    // Handle email_template
    if (settings.email_template !== undefined) {
      updateData.email_template = settings.email_template
    } else if (existingSettings?.email_template) {
      updateData.email_template = existingSettings.email_template
    }

    const { data, error } = await supabaseAdmin
      .from('company_verification_settings')
      .upsert(updateData, {
        onConflict: 'company_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving verification settings:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error in saveVerificationSettings:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update prevention step completion
 */
export async function updatePreventionStep(
  companyId: string,
  step: 2 | 3
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current verification settings
    const { data: verificationSettings, error: fetchError } = await supabaseAdmin
      .from('company_verification_settings')
      .select('prevention_steps, is_verified')
      .eq('company_id', companyId)
      .single()

    if (fetchError || !verificationSettings) {
      return {
        success: false,
        error: 'Verification settings not found. Please complete step 1 first.',
      }
    }

    // Get current prevention_steps JSONB
    const preventionSteps = verificationSettings.prevention_steps || { step1: false, step2: false, step3: false }

    // Steps can be completed in any order - no sequential requirements

    // Update the step completion status in JSONB
    preventionSteps[`step${step}`] = true
    
    // If marking step 2 or 3, ensure step 1 is also marked if is_verified is true
    if (step === 2 && verificationSettings.is_verified && !preventionSteps.step1) {
      preventionSteps.step1 = true
    }

    const { error: updateError } = await supabaseAdmin
      .from('company_verification_settings')
      .update({
        prevention_steps: preventionSteps,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)

    if (updateError) {
      console.error('Error updating step completion:', updateError)
      return {
        success: false,
        error: 'Failed to update step completion',
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePreventionStep:', error)
    return {
      success: false,
      error: error.message || 'Internal server error',
    }
  }
}

/**
 * Brevo API integration functions
 */

export interface BrevoDomainResponse {
  domain: string
  verified: boolean
  authenticated: boolean
  dns_records?: {
    dkim_record?: {
      type: string
      value: string
      host_name: string
      status: boolean
    }
    brevo_code?: {
      type: string
      value: string
      host_name: string
      status: boolean
    }
  }
}

export interface BrevoCreateDomainResponse {
  id: string
  domain_name: string
  message: string
  dns_records: {
    dkim_record: {
      type: string
      value: string
      host_name: string
      status: boolean
    }
    brevo_code: {
      type: string
      value: string
      host_name: string
      status: boolean
    }
  }
}

export interface BrevoAuthenticateResponse {
  domain_name: string
  message: string
}

/**
 * Validate domain configuration with Brevo
 */
export async function validateBrevoDomain(domainName: string): Promise<{
  success: boolean
  data?: BrevoDomainResponse
  error?: string
}> {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    if (!brevoApiKey) {
      return {
        success: false,
        error: 'Email service configuration error. BREVO_API_KEY is not set.',
      }
    }

    const encodedDomain = encodeURIComponent(domainName)
    const response = await fetch(`https://api.brevo.com/v3/senders/domains/${encodedDomain}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Failed to validate domain'
      if (data.message) {
        errorMessage = data.message
      } else if (response.status === 404) {
        errorMessage = 'Domain does not exist in Brevo'
      } else if (response.status === 401) {
        errorMessage = 'Invalid Brevo API key'
      }
      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      data: data as BrevoDomainResponse,
    }
  } catch (error: any) {
    console.error('Error validating Brevo domain:', error)
    return {
      success: false,
      error: error.message || 'Failed to communicate with email service',
    }
  }
}

/**
 * Create a new domain in Brevo
 */
export async function createBrevoDomain(domain: string): Promise<{
  success: boolean
  data?: BrevoCreateDomainResponse
  error?: string
}> {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    if (!brevoApiKey) {
      return {
        success: false,
        error: 'Email service configuration error. BREVO_API_KEY is not set.',
      }
    }

    const response = await fetch('https://api.brevo.com/v3/senders/domains', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: domain.trim(),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Failed to add domain to Brevo'
      if (data.message) {
        errorMessage = data.message
      } else if (data.error) {
        errorMessage = data.error
      } else if (response.status === 401) {
        errorMessage = 'Invalid Brevo API key. Please check BREVO_API_KEY in environment variables.'
      } else if (response.status === 400) {
        errorMessage = data.message || 'Invalid domain format'
      }
      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      data: data as BrevoCreateDomainResponse,
    }
  } catch (error: any) {
    console.error('Error creating Brevo domain:', error)
    return {
      success: false,
      error: error.message || 'Failed to communicate with email service',
    }
  }
}

/**
 * Authenticate a domain in Brevo
 */
export async function authenticateBrevoDomain(domainName: string): Promise<{
  success: boolean
  data?: BrevoAuthenticateResponse
  error?: string
}> {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    if (!brevoApiKey) {
      return {
        success: false,
        error: 'Email service configuration error. BREVO_API_KEY is not set.',
      }
    }

    const encodedDomain = encodeURIComponent(domainName)
    const response = await fetch(`https://api.brevo.com/v3/senders/domains/${encodedDomain}/authenticate`, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Failed to authenticate domain'
      if (data.message) {
        errorMessage = data.message
      } else if (response.status === 404) {
        errorMessage = 'Domain does not exist in Brevo'
      } else if (response.status === 400) {
        errorMessage = data.message || 'Bad request. DNS records may not be configured correctly.'
      } else if (response.status === 401) {
        errorMessage = 'Invalid Brevo API key'
      }
      return {
        success: false,
        error: errorMessage,
      }
    }

    return {
      success: true,
      data: data as BrevoAuthenticateResponse,
    }
  } catch (error: any) {
    console.error('Error authenticating Brevo domain:', error)
    return {
      success: false,
      error: error.message || 'Failed to communicate with email service',
    }
  }
}
