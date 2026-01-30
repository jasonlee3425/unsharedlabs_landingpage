/**
 * Company service
 * Handles company creation and management operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Company } from '../types/auth.types'

/**
 * Create a new company
 * @param supabaseClient - Authenticated Supabase client (with user session)
 * @param name - Company name
 * @param userId - User ID who is creating the company
 * @param websiteUrl - Optional company website URL
 */
export async function createCompany(
  supabaseClient: SupabaseClient,
  name: string,
  userId: string,
  websiteUrl?: string | null
): Promise<{ company: Company | null; error?: string }> {
  try {
    // Create company in companies table
    const companyData: any = { name: name.trim() }
    if (websiteUrl && websiteUrl.trim()) {
      companyData.website_url = websiteUrl.trim()
    }
    
    const { data: newCompany, error: companyError } = await supabaseClient
      .from('companies')
      .insert(companyData)
      .select('id, name, website_url, created_at, updated_at')
      .single()

    if (companyError || !newCompany) {
      console.error('Error creating company:', {
        error: companyError,
        code: companyError?.code,
        message: companyError?.message,
        details: companyError?.details,
        hint: companyError?.hint,
        name: name.trim()
      })
      return { 
        company: null, 
        error: companyError?.message || 'Failed to create company' 
      }
    }

    // Update user_profiles table to set company_id and company_role for the user
    // Company creator is automatically an admin
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .update({ 
        company_id: newCompany.id,
        company_role: 'admin' // Company creator is automatically an admin
      })
      .eq('user_id', userId)

    if (profileError) {
      console.error('Error updating user profile:', {
        error: profileError,
        code: profileError?.code,
        message: profileError?.message,
        details: profileError?.details,
        hint: profileError?.hint,
        userId,
        companyId: newCompany.id
      })
      // Company was created, but profile update failed - try to clean up
      await supabaseClient.from('companies').delete().eq('id', newCompany.id)
      return { 
        company: null, 
        error: profileError?.message || 'Failed to update user profile' 
      }
    }

    return { company: newCompany }
  } catch (err: any) {
    console.error('Unexpected error creating company:', err)
    return { company: null, error: err.message || 'An unexpected error occurred' }
  }
}

/**
 * Update company name and/or website
 * @param supabaseClient - Authenticated Supabase client (with user session)
 * @param companyId - Company ID to update
 * @param name - New company name
 * @param websiteUrl - Optional new company website URL
 */
export async function updateCompany(
  supabaseClient: SupabaseClient,
  companyId: string,
  name: string,
  websiteUrl?: string | null
): Promise<{ company: Company | null; error?: string }> {
  try {
    const updateData: any = { 
      name: name.trim(), 
      updated_at: new Date().toISOString() 
    }
    if (websiteUrl !== undefined) {
      updateData.website_url = websiteUrl && websiteUrl.trim() ? websiteUrl.trim() : null
    }
    
    const { data: updatedCompany, error: updateError } = await supabaseClient
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select('id, name, website_url, created_at, updated_at')
      .single()

    if (updateError || !updatedCompany) {
      console.error('Error updating company:', {
        error: updateError,
        code: updateError?.code,
        message: updateError?.message,
        companyId,
        name: name.trim()
      })
      return {
        company: null,
        error: updateError?.message || 'Failed to update company'
      }
    }

    return { company: updatedCompany }
  } catch (err: any) {
    console.error('Unexpected error updating company:', err)
    return { company: null, error: err.message || 'An unexpected error occurred' }
  }
}
