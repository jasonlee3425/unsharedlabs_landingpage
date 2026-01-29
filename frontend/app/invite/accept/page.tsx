'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link. No token provided.')
      return
    }

    acceptInvitation()
  }, [token])

  const acceptInvitation = async () => {
    try {
      // Check if session token was passed from callback
      const sessionTokenFromUrl = searchParams.get('session')
      const sessionToken = sessionTokenFromUrl || localStorage.getItem('sb-access-token')
      
      if (!sessionToken) {
        // User not logged in - redirect to signup with invite token
        router.push(`/signup?invite=${token}`)
        return
      }

      // Store session token if it came from URL
      if (sessionTokenFromUrl) {
        localStorage.setItem('sb-access-token', sessionTokenFromUrl)
      }

      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API error:', { status: response.status, data })
        setStatus('error')
        setMessage(data.error || `Failed to accept invitation (${response.status})`)
        return
      }

      if (data.success) {
        setStatus('success')
        setMessage('Invitation accepted! Refreshing your account...')
        
        // Refresh user to get updated company info
        try {
          await refreshUser()
          console.log('User refreshed successfully')
          
          // Wait a moment for state to propagate, then redirect
          setTimeout(() => {
            router.push('/dashboard/company')
          }, 1500)
        } catch (refreshError) {
          console.error('Error refreshing user:', refreshError)
          // Still redirect even if refresh fails - the backend update succeeded
          setTimeout(() => {
            router.push('/dashboard/company')
          }, 1500)
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setStatus('error')
      setMessage('An error occurred while accepting the invitation')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--text-primary)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Processing invitation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div 
        className="max-w-md w-full p-8 rounded-lg border-2 text-center"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        {status === 'success' ? (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#28a745' }} />
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Invitation Accepted!
            </h1>
            <p style={{ color: 'var(--text-tertiary)' }}>{message}</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#dc3545' }} />
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Invitation Error
            </h1>
            <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>{message}</p>
            <button
              onClick={() => router.push('/signin')}
              className="px-6 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--active-bg)',
                color: 'var(--text-primary)'
              }}
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
