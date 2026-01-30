import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { 
  getVerificationSettings, 
  saveVerificationSettings,
  validateBrevoDomain,
  createBrevoDomain
} from '@backend/services/verification.service'

/**
 * GET /api/companies/[companyId]/verification/domain
 * Validate domain configuration with Brevo
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

    // Get verification settings to find the domain
    const { data: verificationSettings, error: fetchError } = await getVerificationSettings(companyId)

    if (fetchError || !verificationSettings || !verificationSettings.domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not configured. Please set up domain first.' },
        { status: 400 }
      )
    }

    // Validate domain using backend service
    const validationResult = await validateBrevoDomain(verificationSettings.domain)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 500 }
      )
    }

    const brevoData = validationResult.data!

    // Get stored DNS records to include constructed records
    const { data: storedSettings } = await getVerificationSettings(companyId)
    let allDnsRecords = storedSettings?.domain_dns_records || null

    // If we have stored DNS records, merge with validation status from Brevo
    if (allDnsRecords && brevoData.dns_records) {
      // Update status from Brevo validation response
      if (allDnsRecords.dkim_txt && brevoData.dns_records.dkim_record) {
        allDnsRecords.dkim_txt.status = brevoData.dns_records.dkim_record.status
      }
      if (allDnsRecords.brevo_code && brevoData.dns_records.brevo_code) {
        allDnsRecords.brevo_code.status = brevoData.dns_records.brevo_code.status
      }
    } else if (brevoData.dns_records && storedSettings?.domain) {
      // If we don't have stored records but have a domain, construct them
      const domainName = storedSettings.domain
      const domainForDkim = domainName.replace(/\./g, '-')
      allDnsRecords = {
        dkim_txt: brevoData.dns_records.dkim_record || null,
        brevo_code: brevoData.dns_records.brevo_code || null,
        dkim1_cname: {
          type: 'CNAME',
          name: 'brevo1._domainkey',
          value: `b1.${domainForDkim}.dkim.brevo.com`,
          host_name: 'brevo1._domainkey',
        },
        dkim2_cname: {
          type: 'CNAME',
          name: 'brevo2._domainkey',
          value: `b2.${domainForDkim}.dkim.brevo.com`,
          host_name: 'brevo2._domainkey',
        },
        dmarc_txt: {
          type: 'TXT',
          name: '_dmarc',
          value: 'v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com',
          host_name: '_dmarc',
        },
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        domain: brevoData.domain,
        verified: brevoData.verified || false,
        authenticated: brevoData.authenticated || false,
        dns_records: allDnsRecords || brevoData.dns_records || null,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/companies/[companyId]/verification/domain
 * Set up domain authentication with Brevo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Validate domain format (basic validation)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain format' },
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

    // Create domain using backend service
    const createResult = await createBrevoDomain(domain)
    
    if (!createResult.success) {
      return NextResponse.json(
        { success: false, error: createResult.error },
        { status: 500 }
      )
    }

    const brevoData = createResult.data!

      // Extract domain ID and DNS records from response
      // Response structure from Brevo API:
      // {
      //   "id": "641db448a6a7ea326e585e15",
      //   "domain_name": "mycompany.com",
      //   "message": "Domain added successfully. To authenticate it, add following DNS records",
      //   "dns_records": {
      //     "dkim_record": { "type": "TXT", "value": "...", "host_name": "mail._domainkey.", "status": false },
      //     "brevo_code": { "type": "TXT", "value": "brevo-code:...", "host_name": "", "status": false }
      //   }
      // }
      const domainId = brevoData.id?.toString() || null
      const brevoDnsRecords = brevoData.dns_records || null

      // Construct all DNS records (4 total)
      const domainName = domain.trim()
      // Replace dots with hyphens for DKIM CNAME records (e.g., testunsharedlabs.com -> testunsharedlabs-com)
      const domainForDkim = domainName.replace(/\./g, '-')
      
      const allDnsRecords = {
        // 1. DKIM TXT record from Brevo
        dkim_txt: brevoDnsRecords?.dkim_record || null,
        // 2. Brevo Code TXT record from Brevo
        brevo_code: brevoDnsRecords?.brevo_code || null,
        // 3. DKIM 1 CNAME record (constructed)
        dkim1_cname: {
          type: 'CNAME',
          name: 'brevo1._domainkey',
          value: `b1.${domainForDkim}.dkim.brevo.com`,
          host_name: 'brevo1._domainkey',
        },
        // 4. DKIM 2 CNAME record (constructed)
        dkim2_cname: {
          type: 'CNAME',
          name: 'brevo2._domainkey',
          value: `b2.${domainForDkim}.dkim.brevo.com`,
          host_name: 'brevo2._domainkey',
        },
        // 5. DMARC TXT record (constructed)
        dmarc_txt: {
          type: 'TXT',
          name: '_dmarc',
          value: 'v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com',
          host_name: '_dmarc',
        },
      }

      // Save domain configuration to database
      const { data: verificationSettings, error: dbError } = await saveVerificationSettings(companyId, {
        domain: domainName,
        domain_brevo_id: domainId,
        domain_dns_records: allDnsRecords,
      })

      if (dbError) {
        return NextResponse.json(
          { success: false, error: 'Failed to save domain configuration' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: brevoData.message || 'Domain added successfully. Please add the DNS records below to authenticate your domain.',
        data: {
          domain: domainName,
          domain_id: domainId,
          dns_records: allDnsRecords,
        }
      })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
