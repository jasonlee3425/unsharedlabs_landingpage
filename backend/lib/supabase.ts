/**
 * Server-side Supabase client
 * This should only be used in API routes, not in client components
 * 
 * Uses anon key for regular auth operations (signup with SMTP email confirmation)
 * Uses service role key for admin operations (creating user profiles, bypassing RLS)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
// Try multiple possible env var names for anon/public API key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_API_KEY ||
                        process.env.NEXT_PUBLIC_SUPABASE_API_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('⚠️ Supabase URL missing! Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
}

// For auth operations, prefer anon key but allow service role key as fallback
// Note: Anon key is recommended for user signup (respects RLS), but service role key will work too
const authKey = supabaseAnonKey || supabaseServiceKey

if (!authKey) {
  console.error('⚠️ Supabase API key missing!')
  console.error('   Set one of: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, SUPABASE_API_KEY')
  console.error('   Or use SUPABASE_SERVICE_ROLE_KEY as fallback')
  console.error('   Get anon key from: Supabase Dashboard → Settings → API → anon/public key')
}

// Regular client for auth operations (signup with SMTP email confirmation)
// Uses anon key if available, falls back to service role key if needed
export const supabase = supabaseUrl && authKey
  ? createClient(supabaseUrl, authKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Admin client for operations that need to bypass RLS (like creating user profiles)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null
