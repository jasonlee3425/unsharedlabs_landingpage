'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Shield, Mail, Clock, CheckCircle, AlertTriangle, Edit, Globe, X } from 'lucide-react'

interface PreventionSteps {
  step1: boolean
  step2: boolean
  step3: boolean
}

interface VerificationSettings {
  id: string
  company_id: string
  sender_name: string | null
  sender_email: string | null
  sender_id: number | null
  is_verified: boolean
  prevention_steps?: PreventionSteps
  created_at: string
  updated_at: string
}

export default function PreventionPage() {
  const { user } = useAuth()
  const companyId = user?.companyId

  const [verificationSettings, setVerificationSettings] = useState<VerificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationName, setVerificationName] = useState('')
  const [isCreatingSender, setIsCreatingSender] = useState(false)
  const [senderCreated, setSenderCreated] = useState(false)
  const [otp, setOtp] = useState('')
  const [isValidatingOtp, setIsValidatingOtp] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [dismissedSuccessBanner, setDismissedSuccessBanner] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isUpdatingSender, setIsUpdatingSender] = useState(false)
  const [isMarkingStepComplete, setIsMarkingStepComplete] = useState<number | null>(null)

  // Fetch verification settings on load
  useEffect(() => {
    if (companyId) {
      fetchVerificationSettings()
    }
  }, [companyId])

  const fetchVerificationSettings = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    try {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/verification`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json?.success && json.data) {
        setVerificationSettings(json.data)
        if (json.data.is_verified) {
          setSenderCreated(true)
        } else if (json.data.sender_id) {
          setSenderCreated(true)
          setVerificationEmail(json.data.sender_email || '')
          setVerificationName(json.data.sender_name || '')
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch verification settings:', e)
    } finally {
      setLoading(false)
    }
  }

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
        await fetchVerificationSettings()
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

  // Update sender for account verification
  const handleUpdateSender = async () => {
    if (!companyId || !verificationEmail || !verificationName) return
    const token = getSessionToken()
    if (!token) return

    setIsUpdatingSender(true)
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
        setShowUpdateForm(false)
        setShowConfirmDialog(false)
        setSenderCreated(true)
        setOtp('')
        await fetchVerificationSettings()
      } else {
        setVerificationError(json?.error || 'Failed to update sender')
      }
    } catch (e: any) {
      console.error('Failed to update sender:', e)
      setVerificationError(e.message || 'Failed to update sender')
    } finally {
      setIsUpdatingSender(false)
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
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      })
      const json = await res.json()
      if (json?.success) {
        setAuthSuccess(true)
        setVerificationError(null)
        setOtp('')
        await fetchVerificationSettings()
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

  // Mark step as complete
  const handleMarkStepComplete = async (step: number) => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    setIsMarkingStepComplete(step)
    setVerificationError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ step })
      })
      const json = await res.json()
      if (json?.success) {
        await fetchVerificationSettings()
      } else {
        setVerificationError(json?.error || `Failed to mark step ${step} as complete`)
      }
    } catch (e: any) {
      console.error(`Failed to mark step ${step} as complete:`, e)
      setVerificationError(e.message || `Failed to mark step ${step} as complete`)
    } finally {
      setIsMarkingStepComplete(null)
    }
  }

  // Calculate progress from JSONB prevention_steps
  const preventionSteps = verificationSettings?.prevention_steps || { step1: false, step2: false, step3: false }
  const step1Complete = preventionSteps.step1 || verificationSettings?.is_verified || false
  const step2Complete = preventionSteps.step2 || false
  const step3Complete = preventionSteps.step3 || false
  
  const currentStep = step3Complete ? 3 : (step2Complete ? 2 : (step1Complete ? 1 : 0))
  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const isVerified = verificationSettings?.is_verified || false
  const showSetupForm = !isVerified && (showUpdateForm || !verificationSettings?.sender_id)
  
  // Check if steps can be marked complete (sequential requirement)
  const canMarkStep2 = step1Complete && !step2Complete
  const canMarkStep3 = step2Complete && !step3Complete

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

        {/* Success Banner */}
        {authSuccess && !dismissedSuccessBanner && (
          <div className="mb-6 p-4 rounded-lg border-2 flex items-start gap-3 relative" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: '#10b981' }}>
                Account verification successful!
              </p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Your email has been verified. You can now proceed to set up DNS.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedSuccessBanner(true)}
              className="p-1 rounded transition-all flex-shrink-0"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Progress: {currentStep} of {totalSteps} steps completed
            </span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: '#10b981'
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Set up Account Verification
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {currentStep >= 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Domain Set Up
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {currentStep >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Configure Email
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Step 1: Account Verification */}
          <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Set up Account Verification
              </h2>
            </div>

            {isVerified ? (
              <>
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                  <p className="text-sm flex items-center gap-2 mb-3" style={{ color: '#10b981' }}>
                    <CheckCircle className="w-4 h-4" />
                    Account verification completed
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Name:</span>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {verificationSettings?.sender_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Email:</span>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {verificationSettings?.sender_email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(true)
                    setVerificationEmail(verificationSettings?.sender_email || '')
                    setVerificationName(verificationSettings?.sender_name || '')
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-strong)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Update Email for Account Verification
                </button>

                {/* Update Form - appears below current details */}
                {showUpdateForm && (
                  <div className="mt-6 pt-6 border-t-2" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm mb-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                      Update Account Verification Details
                    </p>
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
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={!verificationEmail || !verificationName || isUpdatingSender}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: (!verificationEmail || !verificationName || isUpdatingSender) ? 'var(--hover-bg)' : '#10b981',
                            color: (!verificationEmail || !verificationName || isUpdatingSender) ? 'var(--text-tertiary)' : 'white',
                            cursor: (!verificationEmail || !verificationName || isUpdatingSender) ? 'not-allowed' : 'pointer',
                            opacity: (!verificationEmail || !verificationName || isUpdatingSender) ? 0.5 : 1,
                          }}
                        >
                          {isUpdatingSender ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUpdateForm(false)
                            setVerificationEmail(verificationSettings?.sender_email || '')
                            setVerificationName(verificationSettings?.sender_name || '')
                            setVerificationError(null)
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: 'var(--hover-bg)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-strong)'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : showSetupForm ? (
              <>
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

              </>
            ) : null}

            {verificationError && (
              <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <p className="text-sm" style={{ color: '#ef4444' }}>
                  {verificationError}
                </p>
              </div>
            )}
          </div>

          {/* Step 2: DNS Setup */}
          {currentStep >= 1 && (
            <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {currentStep >= 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Domain Set Up
                </h2>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Configure your DNS records so that emails for account verification are sent from your verified domain.
              </p>

              <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                <div className="flex items-start gap-2 mb-3">
                  <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      DNS Configuration Required
                    </h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      Add the following DNS records to your domain's DNS settings:
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 rounded bg-black/20">
                        <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>SPF Record:</p>
                        <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                          v=spf1 include:unsharedlabs.com ~all
                        </p>
                      </div>
                      <div className="p-3 rounded bg-black/20">
                        <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>DKIM Record:</p>
                        <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                          (Instructions will be provided after email verification)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!step2Complete && (
                <div className="mt-4">
                  {canMarkStep2 ? (
                    <button
                      type="button"
                      onClick={() => handleMarkStepComplete(2)}
                      disabled={isMarkingStepComplete === 2}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: isMarkingStepComplete === 2 ? 'var(--hover-bg)' : '#10b981',
                        color: isMarkingStepComplete === 2 ? 'var(--text-tertiary)' : 'white',
                        cursor: isMarkingStepComplete === 2 ? 'not-allowed' : 'pointer',
                        opacity: isMarkingStepComplete === 2 ? 0.5 : 1,
                      }}
                    >
                      {isMarkingStepComplete === 2 ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Marking Complete...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Complete</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                        <AlertTriangle className="w-4 h-4" />
                        Complete Step 1 to proceed with Domain Set Up.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure Email */}
          {currentStep >= 2 && (
            <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {currentStep >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Configure Email
                </h2>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Customize the email template that gets sent out for account verification.
              </p>

              <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Email Configuration
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Configure the email template, subject line, and content for verification emails.
                    </p>
                    <p className="text-xs mt-2 italic" style={{ color: 'var(--text-tertiary)' }}>
                      Email configuration options will be available here.
                    </p>
                  </div>
                </div>
              </div>

              {!step3Complete && (
                <div className="mt-4">
                  {canMarkStep3 ? (
                    <button
                      type="button"
                      onClick={() => handleMarkStepComplete(3)}
                      disabled={isMarkingStepComplete === 3}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: isMarkingStepComplete === 3 ? 'var(--hover-bg)' : '#10b981',
                        color: isMarkingStepComplete === 3 ? 'var(--text-tertiary)' : 'white',
                        cursor: isMarkingStepComplete === 3 ? 'not-allowed' : 'pointer',
                        opacity: isMarkingStepComplete === 3 ? 0.5 : 1,
                      }}
                    >
                      {isMarkingStepComplete === 3 ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Marking Complete...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Complete</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                        <AlertTriangle className="w-4 h-4" />
                        Complete Step 2 to proceed with email configuration.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="p-6 rounded-lg border-2 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
              <Clock className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmDialog(false)}>
            <div 
              className="p-6 rounded-lg border-2 max-w-md w-full mx-4" 
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Confirm Update
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Are you sure you want to update the verification email? This will require you to verify the new email address with a 6-digit code.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpdateSender}
                  disabled={isUpdatingSender}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1"
                  style={{
                    backgroundColor: isUpdatingSender ? 'var(--hover-bg)' : '#10b981',
                    color: isUpdatingSender ? 'var(--text-tertiary)' : 'white',
                    cursor: isUpdatingSender ? 'not-allowed' : 'pointer',
                    opacity: isUpdatingSender ? 0.5 : 1,
                  }}
                >
                  {isUpdatingSender ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isUpdatingSender}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-strong)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
