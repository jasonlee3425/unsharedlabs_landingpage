import { NextRequest, NextResponse } from 'next/server'
import { getAllCompanies } from '@backend/services/admin.service'
import { getUserProfile } from '@backend/services/auth.service'
import { createClient } from '@supabase/supabase-js'

/**
 * Get all companies (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Verify user is super admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    // Get all companies
    const { companies, error } = await getAllCompanies()

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      companies,
    })
  } catch (error: any) {
    console.error('Get companies error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
