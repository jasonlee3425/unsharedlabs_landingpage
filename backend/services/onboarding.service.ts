/**
 * Onboarding service
 * Handles onboarding state management
 */

import { supabaseAdmin } from '../lib/supabase'

export type OnboardingState = {
  selectedTechStacks?: string[]
  nodejsSteps?: Record<string, boolean>
  nextjsSteps?: Record<string, boolean>
  lastScreen?: 'select' | 'nodejs' | 'nextjs' | 'coming_soon'
  completedTechStacks?: string[]
}

export interface OnboardingRecord {
  state: OnboardingState
  completed: boolean
  completed_at: string | null
  updated_at: string | null
}

export function defaultState(): Required<OnboardingState> {
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
    completedTechStacks: [],
  }
}

/**
 * Get onboarding state for a company
 */
export async function getOnboardingState(companyId: string): Promise<{ data: OnboardingRecord | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_onboarding')
      .select('state, completed, completed_at, updated_at')
      .eq('company_id', companyId)
      .single()

    if (error) {
      // No row yet -> return default without creating it
      if (error.code === 'PGRST116') {
        const defaultOnboarding: OnboardingRecord = {
          state: defaultState(),
          completed: false,
          completed_at: null,
          updated_at: null,
        }
        return { data: defaultOnboarding }
      }
      console.error('Error fetching onboarding state:', error)
      return { data: null, error: error.message }
    }

    const state = { ...defaultState(), ...(data?.state || {}) }

    return {
      data: {
        state,
        completed: Boolean(data?.completed),
        completed_at: data?.completed_at ?? null,
        updated_at: data?.updated_at ?? null,
      }
    }
  } catch (error: any) {
    console.error('Error in getOnboardingState:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Calculate if onboarding is completed based on state
 */
export function calculateCompletion(state: OnboardingState): boolean {
  const nodeSelected = state.selectedTechStacks?.includes('nodejs') || false
  const nextjsSelected = state.selectedTechStacks?.includes('nextjs') || false
  const nodeSteps = state.nodejsSteps || {}
  const nextjsSteps = state.nextjsSteps || {}
  
  const nodeCompleted =
    !nodeSelected || // If not selected, consider it "complete" (doesn't block)
    ['credentials', 'install', 'initialize', 'integrate', 'handle'].every((k) => Boolean(nodeSteps[k]))
  
  const nextjsCompleted =
    !nextjsSelected || // If not selected, consider it "complete" (doesn't block)
    ['install', 'integrate'].every((k) => Boolean(nextjsSteps[k]))

  return nodeCompleted && nextjsCompleted
}

/**
 * Update onboarding state for a company
 */
export async function updateOnboardingState(
  companyId: string,
  incomingState: OnboardingState,
  forceCompleted?: boolean
): Promise<{ data: OnboardingRecord | null; error?: string }> {
  try {
    const mergedState = { ...defaultState(), ...incomingState }

    // Calculate completion
    const isCompleted = forceCompleted !== undefined ? forceCompleted : calculateCompletion(mergedState)
    
    // Track which tech stacks were completed when onboarding is marked complete
    let completedTechStacks = mergedState.completedTechStacks || []
    if (isCompleted && !completedTechStacks.length) {
      // First time completing - track all selected tech stacks
      completedTechStacks = mergedState.selectedTechStacks || []
    } else if (isCompleted) {
      // Already completed before - update to include all currently selected and completed stacks
      const newlyCompleted: string[] = []
      const nodeSelected = mergedState.selectedTechStacks?.includes('nodejs') || false
      const nextjsSelected = mergedState.selectedTechStacks?.includes('nextjs') || false
      const nodeSteps = mergedState.nodejsSteps || {}
      const nextjsSteps = mergedState.nextjsSteps || {}
      
      const nodeCompleted = !nodeSelected || ['credentials', 'install', 'initialize', 'integrate', 'handle'].every((k) => Boolean(nodeSteps[k]))
      const nextjsCompleted = !nextjsSelected || ['install', 'integrate'].every((k) => Boolean(nextjsSteps[k]))
      
      if (nodeSelected && nodeCompleted) newlyCompleted.push('nodejs')
      if (nextjsSelected && nextjsCompleted) newlyCompleted.push('nextjs')
      completedTechStacks = Array.from(new Set([...completedTechStacks, ...newlyCompleted]))
    }
    
    // Update state with completedTechStacks
    const finalState = { ...mergedState, completedTechStacks }

    const { data, error } = await supabaseAdmin
      .from('company_onboarding')
      .upsert(
        {
          company_id: companyId,
          state: finalState,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'company_id' }
      )
      .select('state, completed, completed_at, updated_at')
      .single()

    if (error) {
      console.error('Error updating onboarding state:', error)
      return { data: null, error: error.message }
    }

    const state = { ...defaultState(), ...(data?.state || {}) }

    return {
      data: {
        state,
        completed: Boolean(data?.completed),
        completed_at: data?.completed_at ?? null,
        updated_at: data?.updated_at ?? null,
      }
    }
  } catch (error: any) {
    console.error('Error in updateOnboardingState:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Reset onboarding state for a company (admin only)
 */
export async function resetOnboardingState(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('company_onboarding')
      .update({
        state: defaultState(),
        completed: false,
        completed_at: null,
      })
      .eq('company_id', companyId)

    if (error) {
      console.error('Error resetting onboarding state:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in resetOnboardingState:', error)
    return { success: false, error: error.message }
  }
}
