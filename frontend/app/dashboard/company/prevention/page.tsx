'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Shield, Mail, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function PreventionPage() {
  const { user } = useAuth()
  const companyId = user?.companyId

  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationName, setVerificationName] = useState('')
  const [isCreatingSender, setIsCreatingSender] = useState(false)
  const [senderCreated, setSenderCreated] = useState(false)
  const [otp, setOtp] = useState('')
  const [isValidatingOtp, setIsValidatingOtp] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Create sender for account verification
  const handleCreateSender = async () => {
    if (!companyId || !verificationEmail || !verificationName) return
    const token = getSessionToken()
    if (!token) return

    setIsCreatingSender(true)
    setVerificationError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: verificationEmail,
          name: verificationName
        })
      })
      const json = await res.json()
      if (json?.success) {
        setSenderCreated(true)
      } else {
        setVerificationError(json?.error || 'Failed to create sender')
      }
    } catch (e: any) {
      console.error('Failed to create sender:', e)
      setVerificationError(e.message || 'Failed to create sender')
    } finally {
      setIsCreatingSender(false)
    }
  }

  // Validate OTP
  const handleValidateOtp = async () => {
    if (!companyId || !otp) return
    const token = getSessionToken()
    if (!token) return

    setIsValidatingOtp(true)
    setVerificationError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      })
      const json = await res.json()
      if (json?.success) {
        // Show success message
        setVerificationError(null)
        alert('Account verification successful!')
      } else {
        setVerificationError(json?.error || 'Invalid OTP')
      }
    } catch (e: any) {
      console.error('Failed to validate OTP:', e)
      setVerificationError(e.message || 'Failed to validate OTP')
    } finally {
      setIsValidatingOtp(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Prevention
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Account Verification Settings
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="p-6 rounded-lg border-2 mb-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Set up Account Verification
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Set up account verification to send verification emails from your own domain. This step is optional.
            </p>

            {!senderCreated ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={verificationName}
                      onChange={(e) => setVerificationName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-2 rounded-lg border-2 text-sm"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      The name that will appear in verification emails
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Sender Email
                    </label>
                    <input
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      placeholder="e.g., jason@unsharedlabs.com"
                      className="w-full px-4 py-2 rounded-lg border-2 text-sm"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      The email address that verification emails will be sent from
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateSender}
                    disabled={!verificationEmail || !verificationName || isCreatingSender}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: (!verificationEmail || !verificationName || isCreatingSender) ? 'var(--hover-bg)' : '#10b981',
                      color: (!verificationEmail || !verificationName || isCreatingSender) ? 'var(--text-tertiary)' : 'white',
                      cursor: (!verificationEmail || !verificationName || isCreatingSender) ? 'not-allowed' : 'pointer',
                      opacity: (!verificationEmail || !verificationName || isCreatingSender) ? 0.5 : 1,
                    }}
                  >
                    {isCreatingSender ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Creating Sender...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Create Sender</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                  <p className="text-sm flex items-center gap-2" style={{ color: '#10b981' }}>
                    <CheckCircle className="w-4 h-4" />
                    Sender created successfully! Check your email for a 6-digit verification code.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-2 rounded-lg border-2 text-sm font-mono text-center text-2xl tracking-widest"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Enter the 6-digit code sent to {verificationEmail}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateOtp}
                    disabled={otp.length !== 6 || isValidatingOtp}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: (otp.length !== 6 || isValidatingOtp) ? 'var(--hover-bg)' : '#10b981',
                      color: (otp.length !== 6 || isValidatingOtp) ? 'var(--text-tertiary)' : 'white',
                      cursor: (otp.length !== 6 || isValidatingOtp) ? 'not-allowed' : 'pointer',
                      opacity: (otp.length !== 6 || isValidatingOtp) ? 0.5 : 1,
                    }}
                  >
                    {isValidatingOtp ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Authenticate</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {verificationError && (
              <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <p className="text-sm" style={{ color: '#ef4444' }}>
                  {verificationError}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg mt-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> This step is optional. You can skip it and complete it later if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
