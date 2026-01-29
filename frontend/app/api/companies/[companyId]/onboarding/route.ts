import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type OnboardingState = {
  selectedTechStacks?: string[]
  nodejsSteps?: Record<string, boolean>
  nextjsSteps?: Record<string, boolean>
  lastScreen?: 'select' | 'nodejs' | 'nextjs' | 'coming_soon'
}

function defaultState(): Required<OnboardingState> {
  return {
    selectedTechStacks: [],
    nodejsSteps: {
      credentials: false,
      install: false,
      initialize: false,
      integrate: false,
      handle: false,
    },
    nextjsSteps: {
      install: false,
      integrate: false,
    },
    lastScreen: 'select',
  }
}

/**
 * GET /api/companies/[companyId]/onboarding
 * Get company onboarding state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken =
      authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseAnonKey || supabaseServiceKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${sessionToken}` } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    // Membership check (same pattern as /data)
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

    const { data: onboardingRow, error: onboardingError } = await supabase
      .from('company_onboarding')
      .select('state, completed, completed_at, updated_at')
      .eq('company_id', params.companyId)
      .single()

    if (onboardingError) {
      // No row yet -> return default without creating it
      if (onboardingError.code === 'PGRST116') {
        return NextResponse.json(
          { success: true, state: defaultState(), completed: false, updated_at: null },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { success: false, error: onboardingError.message || 'Failed to fetch onboarding state' },
        { status: 500 }
      )
    }

    const state = { ...defaultState(), ...(onboardingRow?.state || {}) }

    return NextResponse.json(
      {
        success: true,
        state,
        completed: Boolean(onboardingRow?.completed),
        completed_at: onboardingRow?.completed_at ?? null,
        updated_at: onboardingRow?.updated_at ?? null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get company onboarding error:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

/**
 * PUT /api/companies/[companyId]/onboarding
 * Upsert onboarding state (company member)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken =
      authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_API_KEY
    const supabaseKey = supabaseAnonKey || supabaseServiceKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${sessionToken}` } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    // Membership check
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

    const body = await request.json()
    const incomingState: OnboardingState | undefined = body?.state

    if (!incomingState || typeof incomingState !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload. Expected { state }' }, { status: 400 })
    }

    const mergedState = { ...defaultState(), ...incomingState }

    // Define completion criteria: All selected tech stacks must have all their steps completed
    const nodeSelected = mergedState.selectedTechStacks.includes('nodejs')
    const nextjsSelected = mergedState.selectedTechStacks.includes('nextjs')
    const nodeSteps = mergedState.nodejsSteps || {}
    const nextjsSteps = mergedState.nextjsSteps || {}
    
    const nodeCompleted =
      !nodeSelected || // If not selected, consider it "complete" (doesn't block)
      ['credentials', 'install', 'initialize', 'integrate', 'handle'].every((k) => Boolean(nodeSteps[k]))
    
    const nextjsCompleted =
      !nextjsSelected || // If not selected, consider it "complete" (doesn't block)
      ['install', 'integrate'].every((k) => Boolean(nextjsSteps[k]))

    const isCompleted = nodeCompleted && nextjsCompleted
    const completed = Boolean(body?.completed ?? isCompleted)
    
    // Track which tech stacks were completed when onboarding is marked complete
    let completedTechStacks = mergedState.completedTechStacks || []
    if (isCompleted && !completedTechStacks.length) {
      // First time completing - track all selected tech stacks
      completedTechStacks = mergedState.selectedTechStacks || []
    } else if (isCompleted) {
      // Already completed before - update to include all currently selected and completed stacks
      const newlyCompleted: string[] = []
      if (nodeSelected && nodeCompleted) newlyCompleted.push('nodejs')
      if (nextjsSelected && nextjsCompleted) newlyCompleted.push('nextjs')
      completedTechStacks = Array.from(new Set([...completedTechStacks, ...newlyCompleted]))
    }
    
    // Update state with completedTechStacks
    const finalState = { ...mergedState, completedTechStacks }

    const { data: upserted, error: upsertError } = await supabase
      .from('company_onboarding')
      .upsert(
        {
          company_id: params.companyId,
          state: finalState,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'company_id' }
      )
      .select('state, completed, completed_at, updated_at')
      .single()

    if (upsertError) {
      return NextResponse.json(
        { success: false, error: upsertError.message || 'Failed to update onboarding state' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        state: { ...defaultState(), ...(upserted?.state || {}) },
        completed: Boolean(upserted?.completed),
        completed_at: upserted?.completed_at ?? null,
        updated_at: upserted?.updated_at ?? null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update company onboarding error:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}

