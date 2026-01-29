/**
 * Data service
 * Handles company data operations
 */

import { supabaseAdmin } from '../lib/supabase'

export interface CompanyDataRecord {
  id: string
  data: any
  version: number
  created_at: string
  updated_at: string
}

/**
 * Get current company data
 */
export async function getCompanyData(companyId: string): Promise<{ data: CompanyDataRecord | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_data')
      .select('id, data, version, created_at, updated_at')
      .eq('company_id', companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is okay
        return { data: null }
      }
      console.error('Error fetching company data:', error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error('Error in getCompanyData:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Check if onboarding is complete for a company
 */
export async function isOnboardingComplete(companyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_onboarding')
      .select('completed')
      .eq('company_id', companyId)
      .single()

    if (error || !data) {
      return false
    }

    return data.completed === true
  } catch (error) {
    return false
  }
}

/**
 * Get data history for a company
 */
export async function getDataHistory(companyId: string): Promise<{ data: CompanyDataRecord[] | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_data')
      .select('id, data, version, created_at, updated_at')
      .eq('company_id', companyId)
      .order('version', { ascending: false })

    if (error) {
      console.error('Error fetching data history:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [] }
  } catch (error: any) {
    console.error('Error in getDataHistory:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get specific version of company data
 */
export async function getDataByVersion(
  companyId: string,
  version: number
): Promise<{ data: CompanyDataRecord | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_data')
      .select('id, data, version, created_at, updated_at')
      .eq('company_id', companyId)
      .eq('version', version)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Version not found' }
      }
      console.error('Error fetching data by version:', error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error('Error in getDataByVersion:', error)
    return { data: null, error: error.message }
  }
}
