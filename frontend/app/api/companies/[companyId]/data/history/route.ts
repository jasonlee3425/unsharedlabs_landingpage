import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/companies/[companyId]/data/history
 * Get company data history (all versions)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
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

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get history with pagination
    const { data: history, error: historyError } = await supabase
      .from('company_data_history')
      .select('id, data, version, created_at', { count: 'exact' })
      .eq('company_id', params.companyId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      return NextResponse.json(
        { success: false, error: historyError.message || 'Failed to fetch history' },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from('company_data_history')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', params.companyId)

    return NextResponse.json({
      success: true,
      history: history || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get company data history error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
