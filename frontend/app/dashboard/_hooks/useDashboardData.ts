import { useState, useEffect } from 'react'
import { CompanyData } from '../_types/dashboard.types'
import { getSessionToken } from '@/lib/auth'

export function useDashboardData(
  companyId: string | undefined,
  onboardingCompleted: boolean,
  hasPreviouslyCompletedStacks: boolean
) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) {
      setDataLoading(false)
      setCompanyData(null)
      setDataError(null)
      return
    }

    // Fetch data if onboarding is completed OR if there are previously completed stacks
    const shouldFetchData = onboardingCompleted || hasPreviouslyCompletedStacks

    if (!shouldFetchData) {
      setDataLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setDataLoading(true)
        setDataError(null)
        setCompanyData(null)

        const sessionToken = await getSessionToken()
        if (!sessionToken) {
          setDataError('Not authenticated')
          setDataLoading(false)
          return
        }

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
        console.error('Error fetching company data:', error)
        setDataError('Failed to load dashboard')
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [companyId, onboardingCompleted, hasPreviouslyCompletedStacks])

  return { companyData, dataLoading, dataError }
}
