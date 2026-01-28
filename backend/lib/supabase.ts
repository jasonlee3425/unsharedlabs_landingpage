/**
 * Server-side Supabase client
 * This should only be used in API routes, not in client components
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase configuration missing. Please set environment variables.')
}

// Use service role key for server-side operations (more permissions)
// Fall back to anon key if service role key is not available
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key')
