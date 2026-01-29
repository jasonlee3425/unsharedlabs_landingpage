import { useState, useEffect } from 'react'
import { CompanyData } from '../_types/dashboard.types'
import { getSessionToken } from '@/lib/auth'

export function useDashboard(companyId: string | undefined, isLoading: boolean) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [onboardingProgress, setOnboardingProgress] = useState({ completed: 0, total: 5 })
  const [onboardingState, setOnboardingState] = useState<any>(null)
  const [hasNewIncompleteTechStack, setHasNewIncompleteTechStack] = useState(false)
  const [newTechStacks, setNewTechStacks] = useState<string[]>([])
  const [hasPreviouslyCompletedStacks, setHasPreviouslyCompletedStacks] = useState(false)
  const [hasIncompleteOnboarding, setHasIncompleteOnboarding] = useState(false)

  useEffect(() => {
    if (isLoading) return

    // No company yet -> gate dashboard and stop loading
    if (!companyId) {
      setOnboardingCompleted(false)
      setDataLoading(false)
      setCompanyData(null)
      setDataError(null)
      return
    }

    const fetchOnboardingAndMaybeData = async () => {
      try {
        setDataLoading(true)
        setDataError(null)
        setCompanyData(null)

        const sessionToken = await getSessionToken()
        if (!sessionToken) {
          setOnboardingCompleted(false)
          setOnboardingProgress({ completed: 0, total: 5 })
          setDataError('Not authenticated')
          setDataLoading(false)
          return
        }

        // 1) Fetch onboarding state
        const onboardingRes = await fetch(`/api/companies/${companyId}/onboarding`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        const onboardingJson = await onboardingRes.json()

        const state = onboardingJson?.state || {}
        setOnboardingState(state)

        // Node.js onboarding has 5 fixed steps: credentials, install, initialize, integrate, handle
        const nodeSteps: Record<string, boolean> = state.nodejsSteps || {}
        const completedCount = Object.values(nodeSteps).filter(Boolean).length
        const totalCount = 5 // Fixed number of Node.js onboarding steps
        setOnboardingProgress({ completed: completedCount, total: totalCount })
        setOnboardingCompleted(Boolean(onboardingJson?.completed))

        // Check if there are incomplete tech stacks
        const completedTechStacks = state.completedTechStacks || []
        const selectedTechStacks = state.selectedTechStacks || []
        const incompleteTechStacksList = selectedTechStacks.filter((stack: string) => !completedTechStacks.includes(stack))
        const hasNew = incompleteTechStacksList.length > 0 && completedTechStacks.length > 0
        const hasIncompleteStacks = incompleteTechStacksList.length > 0
        
        const hasPreviouslyCompleted = completedTechStacks.length > 0
        
        setHasNewIncompleteTechStack(hasNew)
        setNewTechStacks(incompleteTechStacksList)
        setHasPreviouslyCompletedStacks(hasPreviouslyCompleted)
        
        // Track if there are any incomplete stacks (for button visibility)
        setHasIncompleteOnboarding(hasIncompleteStacks || !onboardingJson?.completed)

        // 2) If onboarding incomplete AND no previously completed stacks -> don't fetch data
        // If there are previously completed stacks, allow viewing data even with new incomplete stacks
        if (!onboardingJson?.completed && !hasPreviouslyCompleted) {
          setDataLoading(false)
          return
        }

        // 3) Fetch company data (now allowed)
        const dataRes = await fetch(`/api/companies/${companyId}/data`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        const result = await dataRes.json()

        if (result.success && result.data) {
          setCompanyData(result.data)
        } else if (result.success && !result.data) {
          // No data available yet (new client)
          setCompanyData(null)
        } else {
          setDataError(result.error || 'Failed to load data')
        }
      } catch (error) {
        console.error('Error fetching onboarding/dashboard data:', error)
        setDataError('Failed to load dashboard')
      } finally {
        setDataLoading(false)
      }
    }

    fetchOnboardingAndMaybeData()
  }, [companyId, isLoading])

  return {
    companyData,
    dataLoading,
    dataError,
    onboardingCompleted,
    onboardingProgress,
    onboardingState,
    hasNewIncompleteTechStack,
    newTechStacks,
    hasPreviouslyCompletedStacks,
    hasIncompleteOnboarding,
  }
}
