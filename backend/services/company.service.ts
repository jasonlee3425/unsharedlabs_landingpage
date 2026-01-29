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
 */
export async function createCompany(
  supabaseClient: SupabaseClient,
  name: string,
  userId: string
): Promise<{ company: Company | null; error?: string }> {
  try {
    // Create company in companies table
    const { data: newCompany, error: companyError } = await supabaseClient
      .from('companies')
      .insert({ name: name.trim() })
      .select('id, name, created_at, updated_at')
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
