import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/companies/[companyId]/data/history/[version]
 * Get specific version of company data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; version: string } }
) {
  try {
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
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseAnonKey || supabaseServiceKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
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

    // Check if user has access to this company
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    const isSuperAdmin = userProfile?.role === 'super_admin'
    const hasAccess = isSuperAdmin || userProfile?.company_id === params.companyId

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this company' },
        { status: 403 }
      )
    }

    const version = parseInt(params.version, 10)
    if (isNaN(version) || version < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid version number' },
        { status: 400 }
      )
    }

    // Get specific version from history
    const { data: historyItem, error: historyError } = await supabase
      .from('company_data_history')
      .select('id, data, version, created_at')
      .eq('company_id', params.companyId)
      .eq('version', version)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (historyError) {
      if (historyError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Version not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, error: historyError.message || 'Failed to fetch version' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      version: historyItem.version,
      data: historyItem.data,
      created_at: historyItem.created_at,
    })
  } catch (error: any) {
    console.error('Get company data version error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
