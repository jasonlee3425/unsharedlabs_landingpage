'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCallback = async () => {
    try {
      setIsProcessing(true)
      
      // Supabase sends tokens in URL hash fragments, not query params
      // We need to check both the URL hash and query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const queryParams = new URLSearchParams(window.location.search)
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
      const type = hashParams.get('type') || queryParams.get('type')
      const inviteToken = queryParams.get('invite') || hashParams.get('invite')
      const error = hashParams.get('error') || queryParams.get('error')
      const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')

      if (error) {
        console.error('Auth callback error:', error, errorDescription)
        setIsProcessing(false)
        router.replace(`/signin?error=${encodeURIComponent(errorDescription || error)}`)
        return
      }

      // If we have an access token, store it and verify session
      if (accessToken) {
        // Store session token
        localStorage.setItem('sb-access-token', accessToken)
        
        // Get refresh token if available
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        if (refreshToken) {
          localStorage.setItem('sb-refresh-token', refreshToken)
        }

        // Clear the hash from URL to prevent re-processing
        window.history.replaceState(null, '', window.location.pathname + window.location.search)

        // Verify the session is active by checking with the API
        try {
          const verifyResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })

          if (verifyResponse.ok) {
            const userData = await verifyResponse.json()
            // Session is active and valid
            if (userData.success && userData.user) {
              // If there's an invite token, redirect to accept it
              if (inviteToken) {
                setIsProcessing(false)
                router.replace(`/invite/accept?token=${inviteToken}&session=${accessToken}`)
                return
              }

              // Session is active - redirect to dashboard
              setIsProcessing(false)
              router.replace('/dashboard')
              return
            }
          }
        } catch (verifyError) {
          console.error('Error verifying session:', verifyError)
          // If verification fails, still try to redirect (token might still be valid)
        }

        // If there's an invite token, redirect to accept it (even if verification failed)
        if (inviteToken) {
          setIsProcessing(false)
          router.replace(`/invite/accept?token=${inviteToken}&session=${accessToken}`)
          return
        }

        // Otherwise redirect to dashboard (session should be active after email confirmation)
        setIsProcessing(false)
        router.replace('/dashboard')
        return
      }
      
      setIsProcessing(false)
      // No token - redirect to signin
      router.replace('/signin')
    } catch (error) {
      console.error('Error handling auth callback:', error)
      setIsProcessing(false)
      router.replace('/signin')
    }
  }

  if (!isProcessing) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--text-primary)' }} />
        <p style={{ color: 'var(--text-tertiary)' }}>Completing signup...</p>
      </div>
    </div>
  )
}
