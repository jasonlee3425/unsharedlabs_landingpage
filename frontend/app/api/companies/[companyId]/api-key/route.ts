import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserProfile } from '@backend/services/auth.service'
import { supabaseAdmin } from '@backend/lib/supabase'
import crypto from 'crypto'

/**
 * GET /api/companies/[companyId]/api-key
 * Get the company's API key (if it exists)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

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

    if (!profile || profile.company_id !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get API key for this company
    const { data: apiKeyRecord, error } = await supabase
      .from('company_api_keys')
      .select('api_key, created_at')
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching API key:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: apiKeyRecord ? { apiKey: apiKeyRecord.api_key } : null
    })
  } catch (error: any) {
    console.error('Error in GET /api/companies/[companyId]/api-key:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/companies/[companyId]/api-key
 * Generate a new API key for the company (only if one doesn't exist)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

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

    // Check if API key already exists
    const { data: existingKey } = await supabase
      .from('company_api_keys')
      .select('id')
      .eq('company_id', companyId)
      .single()

    if (existingKey) {
      return NextResponse.json(
        { success: false, error: 'API key already exists. Only one API key can be generated per company.' },
        { status: 400 }
      )
    }

    // Generate a secure random API key (32 bytes = 64 hex characters)
    const apiKey = `usk_${crypto.randomBytes(32).toString('hex')}`

    // Use admin client to insert (bypasses RLS if needed)
    const { data: newKey, error: insertError } = await supabaseAdmin
      .from('company_api_keys')
      .insert({
        company_id: companyId,
        api_key: apiKey
      })
      .select('api_key, created_at')
      .single()

    if (insertError) {
      console.error('Error creating API key:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { apiKey: newKey.api_key }
    })
  } catch (error: any) {
    console.error('Error in POST /api/companies/[companyId]/api-key:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
