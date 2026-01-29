/**
 * API Key service
 * Handles API key generation and management
 */

import { supabaseAdmin } from '../lib/supabase'
import crypto from 'crypto'

export interface ApiKeyRecord {
  api_key: string
  created_at: string
}

/**
 * Get API key for a company
 */
export async function getApiKey(companyId: string): Promise<{ data: ApiKeyRecord | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_api_keys')
      .select('api_key, created_at')
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching API key:', error)
      return { data: null, error: error.message }
    }

    return { data: data || null }
  } catch (error: any) {
    console.error('Error in getApiKey:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Check if API key already exists for a company
 */
export async function apiKeyExists(companyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_api_keys')
      .select('id')
      .eq('company_id', companyId)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

/**
 * Generate and save a new API key for a company
 * Only one API key can exist per company
 */
export async function generateApiKey(companyId: string): Promise<{ data: ApiKeyRecord | null; error?: string }> {
  try {
    // Check if API key already exists
    const exists = await apiKeyExists(companyId)
    if (exists) {
      return {
        data: null,
        error: 'API key already exists. Only one API key can be generated per company.'
      }
    }

    // Generate a secure random API key (32 bytes = 64 hex characters)
    const apiKey = `usk_${crypto.randomBytes(32).toString('hex')}`

    // Insert new API key
    const { data, error } = await supabaseAdmin
      .from('company_api_keys')
      .insert({
        company_id: companyId,
        api_key: apiKey
      })
      .select('api_key, created_at')
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error('Error in generateApiKey:', error)
    return { data: null, error: error.message }
  }
}
