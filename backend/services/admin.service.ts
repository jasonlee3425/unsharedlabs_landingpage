/**
 * Admin service
 * Handles admin operations like fetching companies and clients
 */

import { supabase } from '../lib/supabase'
import type { Company, UserProfile } from '../types/auth.types'

/**
 * Get all companies (super admin only)
 */
export async function getAllCompanies(): Promise<{ companies: Company[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching companies:', error)
      return { companies: [], error: error.message }
    }

    return { companies: data || [] }
  } catch (err: any) {
    console.error('Unexpected error fetching companies:', err)
    return { companies: [], error: err.message }
  }
}

/**
 * Get all clients/users (super admin only)
 */
export async function getAllClients(): Promise<{ clients: Array<UserProfile & { company?: Company }>; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return { clients: [], error: error.message }
    }

    const clients = (data || []).map((client: any) => ({
      ...client,
      company: client.companies || null,
    }))

    return { clients }
  } catch (err: any) {
    console.error('Unexpected error fetching clients:', err)
    return { clients: [], error: err.message }
  }
}

/**
 * Get clients for a specific company
 */
export async function getClientsByCompany(companyId: string): Promise<{ clients: UserProfile[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients by company:', error)
      return { clients: [], error: error.message }
    }

    return { clients: data || [] }
  } catch (err: any) {
    console.error('Unexpected error fetching clients by company:', err)
    return { clients: [], error: err.message }
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<{ company: Company | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return { company: null, error: error.message }
    }

    return { company: data || null }
  } catch (err: any) {
    console.error('Unexpected error fetching company:', err)
    return { company: null, error: err.message }
  }
}
