/**
 * Server-side Supabase client
 * This should only be used in API routes, not in client components
 * 
 * Uses anon key for regular auth operations (signup with SMTP email confirmation)
 * Uses service role key for admin operations (creating user profiles, bypassing RLS)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
// Use SUPABASE_API_KEY as service role key
const supabaseServiceKey = process.env.SUPABASE_API_KEY

if (!supabaseUrl) {
  console.error('⚠️ Supabase URL missing! Set SUPABASE_URL')
}

// For auth operations, prefer anon key but allow service role key as fallback
// Note: Anon key is recommended for user signup (respects RLS), but service role key will work too
const authKey = supabaseAnonKey || supabaseServiceKey

if (!authKey) {
  console.error('⚠️ Supabase API key missing!')
  console.error('   Set SUPABASE_ANON_KEY or SUPABASE_API_KEY')
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
