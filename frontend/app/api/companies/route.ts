import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCompany } from '@backend/services/company.service'

/**
 * POST /api/companies
 * Create a new company and update user's company_id
 */
export async function POST(request: NextRequest) {
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
    // Use SUPABASE_API_KEY as service role key
    const supabaseKey = supabaseAnonKey || process.env.SUPABASE_API_KEY

    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL')
      return NextResponse.json(
        { success: false, error: 'Configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!supabaseKey) {
      console.error('❌ Missing Supabase API key. Set SUPABASE_ANON_KEY or SUPABASE_API_KEY in .env.local')
      console.error('   Get it from: Supabase Dashboard → Settings → API → anon/public key')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration error: Missing Supabase API key. Please set SUPABASE_ANON_KEY or SUPABASE_API_KEY in .env.local' 
        },
        { status: 500 }
      )
    }

    // Warn if using service role key (bypasses RLS)
    if (!supabaseAnonKey && process.env.SUPABASE_API_KEY) {
      console.warn('⚠️  WARNING: Using SUPABASE_API_KEY instead of SUPABASE_ANON_KEY. RLS policies will be bypassed!')
      console.warn('   Please add SUPABASE_ANON_KEY to .env.local for proper RLS enforcement.')
    }

    // Create Supabase client with user's session token
    // IMPORTANT: Use anon key (not service role) so RLS policies are enforced
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      },
    })

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Use backend service to create company (uses authenticated user's Supabase client)
    const { company, error } = await createCompany(supabase, name, user.id)

    if (error || !company) {
      console.error('❌ Company creation failed:', {
        error,
        errorDetails: error,
        userId: user.id,
        companyName: name,
        hasSupabaseClient: !!supabase
      })
      return NextResponse.json(
        { success: false, error: error || 'Failed to create company' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: company,
    })
  } catch (error: any) {
    console.error('Create company error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    return NextResponse.json(
      { success: false, error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/companies
 * Delete the user's company and remove company_id from all members
 */
export async function DELETE(request: NextRequest) {
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
    // Use SUPABASE_API_KEY as service role key
    const supabaseKey = supabaseAnonKey || process.env.SUPABASE_API_KEY

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

    // Get user's profile to find their company_id and check if they're an admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id, company_role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile || !userProfile.company_id) {
      return NextResponse.json(
        { success: false, error: 'No company found' },
        { status: 404 }
      )
    }

    // Only company admins can delete the company
    if (userProfile.company_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only company admins can delete the company' },
        { status: 403 }
      )
    }

    const companyId = userProfile.company_id

    // First, remove company_id from all users in this company
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (updateError) {
      console.error('Error removing company_id from users:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to remove company association' },
        { status: 500 }
      )
    }

    // Then delete the company
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('Error deleting company:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message || 'Failed to delete company' },
        { status: 500 }
      )
    }

    console.log('✅ Company deleted successfully:', companyId)

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete company error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
