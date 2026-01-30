'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Shield, Mail, Clock, CheckCircle, AlertTriangle, Edit, Globe, X, ChevronDown, ChevronUp, Copy, Check, Palette, ChevronRight } from 'lucide-react'

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
  domain?: string | null
  domain_brevo_id?: string | null
  domain_dns_records?: {
    dkim_txt?: any
    brevo_code?: any
    dkim1_cname?: any
    dkim2_cname?: any
    dmarc_txt?: any
  } | null
  created_at: string
  updated_at: string
}

export default function PreventionPage() {
  const { user } = useAuth()
  const companyId = user?.companyId
  const router = useRouter()

  const [verificationSettings, setVerificationSettings] = useState<VerificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationName, setVerificationName] = useState('')
  const [isCreatingSender, setIsCreatingSender] = useState(false)
  const [senderCreated, setSenderCreated] = useState(false)
  const [otp, setOtp] = useState('')
  const [isValidatingOtp, setIsValidatingOtp] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)
  const [dismissedSuccessBanner, setDismissedSuccessBanner] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isUpdatingSender, setIsUpdatingSender] = useState(false)
  const [isMarkingStepComplete, setIsMarkingStepComplete] = useState<number | null>(null)
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({})
  const [isUpdateFlow, setIsUpdateFlow] = useState(false)
  const [updateSenderCreated, setUpdateSenderCreated] = useState(false)
  const [updateOtp, setUpdateOtp] = useState('')
  const [isValidatingUpdateOtp, setIsValidatingUpdateOtp] = useState(false)
  const [domain, setDomain] = useState('')
  const [isSettingUpDomain, setIsSettingUpDomain] = useState(false)
  const [domainDnsRecords, setDomainDnsRecords] = useState<any>(null)
  const [isValidatingDomain, setIsValidatingDomain] = useState(false)
  const [isAuthenticatingDomain, setIsAuthenticatingDomain] = useState(false)
  const [domainValidationResult, setDomainValidationResult] = useState<{
    verified: boolean
    authenticated: boolean
    dns_records: any
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showEditDomainModal, setShowEditDomainModal] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [confirmOldDomain, setConfirmOldDomain] = useState('')
  const [isUpdatingDomain, setIsUpdatingDomain] = useState(false)

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Handle domain update
  const handleUpdateDomain = async () => {
    if (!companyId || !verificationSettings?.domain) return
    const token = getSessionToken()
    if (!token) return

    // Validate that old domain matches
    if (confirmOldDomain !== verificationSettings.domain) {
      setDomainError('Old domain does not match. Please retype the current domain correctly.')
      setTimeout(() => setDomainError(null), 8000)
      return
    }

    // Validate new domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(newDomain.trim())) {
      setDomainError('Invalid domain format')
      setTimeout(() => setDomainError(null), 8000)
      return
    }

    setIsUpdatingDomain(true)
    setDomainError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification/domain`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: newDomain.trim() })
      })
      const json = await res.json()
      if (json?.success) {
        // Close modal and refresh settings
        setShowEditDomainModal(false)
        setNewDomain('')
        setConfirmOldDomain('')
        setDomainDnsRecords(null)
        setDomainValidationResult(null)
        await fetchVerificationSettings()
      } else {
        setDomainError(json?.error || 'Failed to update domain')
        setTimeout(() => setDomainError(null), 8000)
      }
    } catch (e: any) {
      console.error('Failed to update domain:', e)
      setDomainError(e.message || 'Failed to update domain')
      setTimeout(() => setDomainError(null), 8000)
    } finally {
      setIsUpdatingDomain(false)
    }
  }

  // Fetch verification settings on load
  useEffect(() => {
    if (companyId) {
      fetchVerificationSettings()
    }
  }, [companyId])

  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated:', { 
      verificationEmail, 
      verificationName, 
      emailLength: verificationEmail?.length,
      nameLength: verificationName?.length 
    })
  }, [verificationEmail, verificationName])

  const fetchVerificationSettings = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    try {
      // Fetch verification settings
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
          // If sender_id exists but not verified, we should show OTP input
          // Don't set senderCreated to true here - let the UI logic handle it
          setVerificationEmail(json.data.sender_email || '')
          setVerificationName(json.data.sender_name || '')
        }
        // Set domain form values if domain is already configured
        if (json.data.domain) {
          setDomain(json.data.domain)
          // Fetch domain validation status if domain exists
          try {
            const validateRes = await fetch(`/api/companies/${companyId}/verification/domain/validate?domain=${encodeURIComponent(json.data.domain)}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const validateJson = await validateRes.json()
            if (validateJson?.success && validateJson.data) {
              setDomainValidationResult(validateJson.data)
            }
          } catch (validateError) {
            console.error('Failed to fetch domain validation:', validateError)
            // Don't set error here, just log it - domain validation can be done later
          }
        }
        // Load DNS records if they exist
        if (json.data.domain_dns_records) {
          setDomainDnsRecords(json.data.domain_dns_records)
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
    console.log('handleCreateSender called', { companyId, verificationEmail, verificationName })
    
    if (!companyId || !verificationEmail || !verificationName) {
      console.error('Missing required fields:', { companyId, verificationEmail, verificationName })
      setVerificationError('Please fill in both email and name fields')
      return
    }
    const token = getSessionToken()
    if (!token) {
      console.error('No session token found')
      setVerificationError('Not authenticated. Please sign in again.')
      return
    }

    console.log('Creating sender with:', { email: verificationEmail, name: verificationName })
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
      console.log('Create sender response:', { status: res.status, json })
      
      if (json?.success) {
        setSenderCreated(true)
        // Ensure step 1 card is expanded when sender is created so user can enter OTP
        setCollapsedSteps(prev => ({ ...prev, 1: false }))
        await fetchVerificationSettings()
      } else {
        const errorMsg = json?.error || 'Failed to create sender'
        console.error('Failed to create sender:', errorMsg)
        setVerificationError(errorMsg)
      }
    } catch (e: any) {
      console.error('Failed to create sender:', e)
      setVerificationError(e.message || 'Failed to create sender')
    } finally {
      setIsCreatingSender(false)
    }
  }

  // Step 1: Create sender for update flow
  const handleCreateUpdateSender = async () => {
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
          name: verificationName,
          updateMode: true // Flag to indicate this is an update flow
        })
      })
      const json = await res.json()
      if (json?.success) {
        setUpdateSenderCreated(true)
        setUpdateOtp('')
        setShowConfirmDialog(false)
        // Ensure step 1 card is expanded when update sender is created so user can enter OTP
        setCollapsedSteps(prev => ({ ...prev, 1: false }))
      } else {
        setVerificationError(json?.error || 'Failed to create sender')
      }
    } catch (e: any) {
      console.error('Failed to create sender:', e)
      setVerificationError(e.message || 'Failed to create sender')
    } finally {
      setIsUpdatingSender(false)
    }
  }

  // Step 2: Validate OTP and update sender in database
  const handleValidateUpdateOtp = async () => {
    if (!companyId || !updateOtp) return
    const token = getSessionToken()
    if (!token) return

    setIsValidatingUpdateOtp(true)
    setVerificationError(null)

    try {
      // First, get the current sender_id (from the newly created sender)
      const settingsRes = await fetch(`/api/companies/${companyId}/verification`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const settingsJson = await settingsRes.json()
      
      if (!settingsJson?.success || !settingsJson.data?.sender_id) {
        throw new Error('Sender not found. Please create sender first.')
      }

      // Validate OTP and update email/name in one call
      const validateRes = await fetch(`/api/companies/${companyId}/verification`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          otp: updateOtp,
          email: verificationEmail,
          name: verificationName
        })
      })
      const validateJson = await validateRes.json()
      
      if (validateJson?.success) {
        // Success! Reset states and refresh
        setShowUpdateForm(false)
        setIsUpdateFlow(false)
        setUpdateSenderCreated(false)
        setUpdateOtp('')
        setAuthSuccess(true)
        setDismissedSuccessBanner(false)
        await fetchVerificationSettings()
      } else {
        setVerificationError(validateJson?.error || 'Invalid OTP')
      }
    } catch (e: any) {
      console.error('Failed to validate OTP and update:', e)
      setVerificationError(e.message || 'Failed to validate OTP')
    } finally {
      setIsValidatingUpdateOtp(false)
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

  // Handle domain setup
  const handleSetupDomain = async () => {
    if (!companyId || !domain) return
    const token = getSessionToken()
    if (!token) return

    setIsSettingUpDomain(true)
    setDomainError(null)
    setDomainDnsRecords(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification/domain`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: domain.trim()
        })
      })
      const json = await res.json()
      
      if (json?.success) {
        // Store DNS records from response
        if (json.data?.dns_records) {
          setDomainDnsRecords(json.data.dns_records)
        }
        // Refresh verification settings to get updated domain info
        await fetchVerificationSettings()
      } else {
        setDomainError(json?.error || 'Failed to set up domain')
        // Auto-dismiss error after 8 seconds
        setTimeout(() => setDomainError(null), 8000)
      }
    } catch (e: any) {
      console.error('Failed to set up domain:', e)
      setDomainError(e.message || 'Failed to set up domain')
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setDomainError(null), 8000)
    } finally {
      setIsSettingUpDomain(false)
    }
  }

  // Validate domain configuration
  const handleValidateDomain = async () => {
    if (!companyId || !verificationSettings?.domain) return
    const token = getSessionToken()
    if (!token) return

    setIsValidatingDomain(true)
    setDomainError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification/domain`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`
        }
      })
      const json = await res.json()
      
      if (json?.success) {
        setDomainValidationResult(json.data)
        // Update DNS records if they've changed
        if (json.data?.dns_records) {
          setDomainDnsRecords(json.data.dns_records)
        }
      } else {
        setDomainError(json?.error || 'Failed to validate domain')
        setDomainValidationResult(null)
        // Auto-dismiss error after 8 seconds
        setTimeout(() => setDomainError(null), 8000)
      }
    } catch (e: any) {
      console.error('Failed to validate domain:', e)
      setDomainError(e.message || 'Failed to validate domain')
      setDomainValidationResult(null)
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setDomainError(null), 8000)
    } finally {
      setIsValidatingDomain(false)
    }
  }

  // Authenticate domain
  const handleAuthenticateDomain = async () => {
    if (!companyId || !verificationSettings?.domain) return
    const token = getSessionToken()
    if (!token) return

    setIsAuthenticatingDomain(true)
    setDomainError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/verification/domain/authenticate`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`
        }
      })
      const json = await res.json()
      
      if (json?.success) {
        // Re-validate to get updated status
        await handleValidateDomain()
      } else {
        setDomainError(json?.error || 'Failed to authenticate domain')
        // Auto-dismiss error after 8 seconds
        setTimeout(() => setDomainError(null), 8000)
      }
    } catch (e: any) {
      console.error('Failed to authenticate domain:', e)
      setDomainError(e.message || 'Failed to authenticate domain')
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setDomainError(null), 8000)
    } finally {
      setIsAuthenticatingDomain(false)
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
        console.log(`Step ${step} marked as complete successfully`)
        await fetchVerificationSettings()
        console.log('Verification settings refreshed')
      } else {
        console.error('Failed to mark step complete:', json?.error)
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
  // Step 2 is only complete if BOTH prevention_steps.step2 is true AND domain is authenticated
  const step2Complete = (preventionSteps.step2 && domainValidationResult?.authenticated) || false
  const step3Complete = preventionSteps.step3 || false
  
  // Count actual completed steps
  const completedSteps = [step1Complete, step2Complete, step3Complete].filter(Boolean).length
  const totalSteps = 3
  const progress = (completedSteps / totalSteps) * 100

  const isVerified = verificationSettings?.is_verified || false
  const hasSenderId = !!verificationSettings?.sender_id
  // Show setup form only if not verified AND (update form is open OR no sender_id exists yet)
  const showSetupForm = !isVerified && (showUpdateForm || !hasSenderId)
  // Show OTP input if sender_id exists but not verified yet
  const showOtpInput = !isVerified && hasSenderId && !showUpdateForm
  
  // Steps can be marked complete in any order - no sequential requirements
  // Step 2 can be marked complete if domain is authenticated (regardless of step1 or step3 status)
  const canMarkStep2 = domainValidationResult?.authenticated && !step2Complete
  const canMarkStep3 = !step3Complete

  // Helper to generate email domain from company name
  const getCompanyDomain = () => {
    if (!user?.companyName) return 'example.com'
    return user.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + '.com'
  }

  // Placeholders
  const senderNamePlaceholder = user?.companyName 
    ? `e.g., ${user.companyName}`
    : 'e.g., Company Name'
  
  const senderEmailPlaceholder = user?.companyName
    ? `e.g., example@${getCompanyDomain()}`
    : 'e.g., example@company.com'

  // Toggle step collapse
  const toggleStepCollapse = (step: number) => {
    // Prevent collapsing step 1 if user is actively entering OTP or has form open
    // Always keep open when sender is created (waiting for OTP)
    if (step === 1 && (otp.length > 0 || updateOtp.length > 0 || showUpdateForm || senderCreated || updateSenderCreated)) {
      return
    }
    setCollapsedSteps(prev => ({
      ...prev,
      [step]: !prev[step]
    }))
  }

  // Ensure step 1 is expanded when sender is created (both initial and update flows)
  useEffect(() => {
    if ((senderCreated || updateSenderCreated) && collapsedSteps[1]) {
      setCollapsedSteps(prev => ({ ...prev, 1: false }))
    }
  }, [senderCreated, updateSenderCreated])

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
              Progress: {completedSteps} of {totalSteps} steps completed
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
                  step1Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {step1Complete ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Set up Account Verification
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step2Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {step2Complete ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Domain Set Up
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step3Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {step3Complete ? <CheckCircle className="w-5 h-5" /> : '3'}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step1Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {step1Complete ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Set up Account Verification
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleStepCollapse(1)}
                className="p-1 rounded transition-all"
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
                {collapsedSteps[1] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>

            {!collapsedSteps[1] && (
              <>

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
                    setIsUpdateFlow(true)
                    setUpdateSenderCreated(false)
                    setUpdateOtp('')
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
                    
                    {!updateSenderCreated ? (
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
                              placeholder={senderNamePlaceholder}
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
                              placeholder={senderEmailPlaceholder}
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
                              {isUpdatingSender ? 'Creating Sender...' : 'Create Sender'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowUpdateForm(false)
                                setIsUpdateFlow(false)
                                setUpdateSenderCreated(false)
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
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                          <p className="text-sm flex items-center gap-2" style={{ color: '#10b981' }}>
                            <CheckCircle className="w-4 h-4" />
                            Sender created successfully! Check your email ({verificationEmail}) for a 6-digit verification code.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                              Enter 6-Digit Verification Code
                            </label>
                            <input
                              type="text"
                              value={updateOtp}
                              onChange={(e) => setUpdateOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              onFocus={() => {
                                // Ensure step 1 is expanded when user focuses on OTP input
                                if (collapsedSteps[1]) {
                                  setCollapsedSteps(prev => ({ ...prev, 1: false }))
                                }
                              }}
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

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleValidateUpdateOtp}
                              disabled={updateOtp.length !== 6 || isValidatingUpdateOtp}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                              style={{
                                backgroundColor: (updateOtp.length !== 6 || isValidatingUpdateOtp) ? 'var(--hover-bg)' : '#10b981',
                                color: (updateOtp.length !== 6 || isValidatingUpdateOtp) ? 'var(--text-tertiary)' : 'white',
                                cursor: (updateOtp.length !== 6 || isValidatingUpdateOtp) ? 'not-allowed' : 'pointer',
                                opacity: (updateOtp.length !== 6 || isValidatingUpdateOtp) ? 0.5 : 1,
                              }}
                            >
                              {isValidatingUpdateOtp ? (
                                <>
                                  <Clock className="w-4 h-4 animate-spin" />
                                  <span>Validating...</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4" />
                                  <span>Verify & Update</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowUpdateForm(false)
                                setIsUpdateFlow(false)
                                setUpdateSenderCreated(false)
                                setUpdateOtp('')
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
                      </>
                    )}
                  </div>
                )}
              </>
            ) : showOtpInput ? (
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
                      onFocus={() => {
                        // Ensure step 1 is expanded when user focuses on OTP input
                        if (collapsedSteps[1]) {
                          setCollapsedSteps(prev => ({ ...prev, 1: false }))
                        }
                      }}
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
                      Enter the 6-digit code sent to {verificationSettings?.sender_email || verificationEmail}
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
                          value={verificationName || ''}
                          onChange={(e) => {
                            console.log('Name input changed:', e.target.value)
                            setVerificationName(e.target.value)
                          }}
                          placeholder={senderNamePlaceholder}
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
                          value={verificationEmail || ''}
                          onChange={(e) => {
                            console.log('Email input changed:', e.target.value)
                            setVerificationEmail(e.target.value)
                          }}
                          placeholder={senderEmailPlaceholder}
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
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Button clicked', { 
                            verificationEmail, 
                            verificationName, 
                            emailLength: verificationEmail?.length,
                            nameLength: verificationName?.length,
                            emailTruthy: !!verificationEmail,
                            nameTruthy: !!verificationName,
                            isCreatingSender 
                          })
                          handleCreateSender()
                        }}
                        disabled={!verificationEmail?.trim() || !verificationName?.trim() || isCreatingSender}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: (!verificationEmail?.trim() || !verificationName?.trim() || isCreatingSender) ? 'var(--hover-bg)' : '#10b981',
                          color: (!verificationEmail?.trim() || !verificationName?.trim() || isCreatingSender) ? 'var(--text-tertiary)' : 'white',
                          cursor: (!verificationEmail?.trim() || !verificationName?.trim() || isCreatingSender) ? 'not-allowed' : 'pointer',
                          opacity: (!verificationEmail?.trim() || !verificationName?.trim() || isCreatingSender) ? 0.5 : 1,
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
                          onFocus={() => {
                            // Ensure step 1 is expanded when user focuses on OTP input
                            if (collapsedSteps[1]) {
                              setCollapsedSteps(prev => ({ ...prev, 1: false }))
                            }
                          }}
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
            </>
            )}

            {verificationError && (
              <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <p className="text-sm" style={{ color: '#ef4444' }}>
                  {verificationError}
                </p>
              </div>
            )}
          </div>

          {/* Step 2: DNS Setup */}
          <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step2Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {step2Complete ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Domain Set Up
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleStepCollapse(2)}
                className="p-1 rounded transition-all"
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
                {collapsedSteps[2] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>

            {!collapsedSteps[2] && (
              <>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Configure your DNS records so that emails for account verification are sent from your verified domain.
              </p>

              {!verificationSettings?.domain ? (
                <>
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Domain
                      </label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.trim())}
                        placeholder="example.com"
                        className="w-full px-4 py-2 rounded-lg border-2 text-sm"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        The domain you want to authenticate (e.g., example.com)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSetupDomain}
                      disabled={!domain || isSettingUpDomain}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: (!domain || isSettingUpDomain) ? 'var(--hover-bg)' : '#10b981',
                        color: (!domain || isSettingUpDomain) ? 'var(--text-tertiary)' : 'white',
                        cursor: (!domain || isSettingUpDomain) ? 'not-allowed' : 'pointer',
                        opacity: (!domain || isSettingUpDomain) ? 0.5 : 1,
                      }}
                    >
                      {isSettingUpDomain ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Setting up domain...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span>Set Up Domain</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Domain Error Display */}
                  {domainError && (
                    <div className="p-3 rounded-lg mt-4 flex items-start justify-between gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                      <p className="text-sm flex-1" style={{ color: '#ef4444' }}>
                        {domainError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDomainError(null)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-200/20 transition-colors"
                        style={{ color: '#ef4444' }}
                        aria-label="Close error"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-lg mb-4" style={{ 
                  backgroundColor: domainValidationResult?.authenticated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
                  border: `1px solid ${domainValidationResult?.authenticated ? '#10b981' : '#eab308'}` 
                }}>
                  <div className="flex items-start gap-2 mb-3">
                    {domainValidationResult?.authenticated ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    ) : (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#eab308' }} />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold" style={{ color: domainValidationResult?.authenticated ? '#10b981' : '#eab308' }}>
                          {domainValidationResult?.authenticated ? 'Domain Configured' : 'Domain Configuration in Progress'}
                        </h3>
                        {user?.companyRole === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditDomainModal(true)
                              setNewDomain('')
                              setConfirmOldDomain('')
                            }}
                            className="p-1.5 rounded transition-all hover:bg-white/10"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Edit domain"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p style={{ color: 'var(--text-primary)' }}>
                          <span className="font-medium">Domain:</span> {verificationSettings.domain}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain Error Display (when domain is already configured) */}
              {domainError && verificationSettings?.domain && (
                <div className="p-3 rounded-lg mt-4 flex items-start justify-between gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                  <p className="text-sm flex-1" style={{ color: '#ef4444' }}>
                    {domainError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDomainError(null)}
                    className="flex-shrink-0 p-1 rounded hover:bg-red-200/20 transition-colors"
                    style={{ color: '#ef4444' }}
                    aria-label="Close error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Display DNS Records and Validation */}
              {(domainDnsRecords || verificationSettings?.domain) && (
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <div className="flex items-start gap-2 mb-3">
                    <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        DNS Records Required
                      </h3>

                      <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                        Add the following DNS records to your domain's DNS settings to authenticate your domain:
                      </p>
                      <div className="space-y-3">
                        {/* Record 1: Brevo Code TXT (from Brevo POST) */}
                        {(domainDnsRecords?.brevo_code || domainValidationResult?.dns_records?.brevo_code) && (() => {
                          const record = domainDnsRecords?.brevo_code || domainValidationResult?.dns_records?.brevo_code
                          const name = record?.host_name || '@'
                          const value = record?.value || ''
                          return (
                            <div className="p-3 rounded bg-black/20">
                              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Record 1: Brevo Code TXT Record
                              </p>
                              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                Type: {record?.type || 'TXT'}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  Name: {name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(name, 'brevo-code-name')}
                                  className="p-0.5 rounded transition-all hover:bg-white/10"
                                  title="Copy name"
                                >
                                  {copiedField === 'brevo-code-name' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                              <div 
                                className="flex items-center gap-1 mb-2 group"
                              >
                                <p className="text-sm font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
                                  Value: {value}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(value, 'brevo-code-value')}
                                  className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                  title="Copy value"
                                >
                                  {copiedField === 'brevo-code-value' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Record 2: DKIM TXT (from Brevo POST) */}
                        {(domainDnsRecords?.dkim_txt || domainValidationResult?.dns_records?.dkim_record) && (() => {
                          const record = domainDnsRecords?.dkim_txt || domainValidationResult?.dns_records?.dkim_record
                          const name = record?.host_name || 'mail._domainkey'
                          const value = record?.value || ''
                          return (
                            <div className="p-3 rounded bg-black/20">
                              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Record 2: DKIM TXT Record
                              </p>
                              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                Type: {record?.type || 'TXT'}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  Name: {name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(name, 'dkim-txt-name')}
                                  className="p-0.5 rounded transition-all hover:bg-white/10"
                                  title="Copy name"
                                >
                                  {copiedField === 'dkim-txt-name' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                              <div 
                                className="flex items-center gap-1 mb-2 group"
                              >
                                <p className="text-sm font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
                                  Value: {value}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(value, 'dkim-txt-value')}
                                  className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                  title="Copy value"
                                >
                                  {copiedField === 'dkim-txt-value' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Record 3: DKIM 1 CNAME (constructed) */}
                        {domainDnsRecords?.dkim1_cname && (() => {
                          const record = domainDnsRecords.dkim1_cname
                          const name = record?.name || ''
                          const value = record?.value || ''
                          return (
                            <div className="p-3 rounded bg-black/20">
                              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Record 3: DKIM 1 CNAME Record
                              </p>
                              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                Type: {record?.type}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  Name: {name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(name, 'dkim1-cname-name')}
                                  className="p-0.5 rounded transition-all hover:bg-white/10"
                                  title="Copy name"
                                >
                                  {copiedField === 'dkim1-cname-name' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                              <div 
                                className="flex items-center gap-1 mb-2 group"
                              >
                                <p className="text-sm font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
                                  Value: {value}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(value, 'dkim1-cname-value')}
                                  className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                  title="Copy value"
                                >
                                  {copiedField === 'dkim1-cname-value' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Record 4: DKIM 2 CNAME (constructed) */}
                        {domainDnsRecords?.dkim2_cname && (() => {
                          const record = domainDnsRecords.dkim2_cname
                          const name = record?.name || ''
                          const value = record?.value || ''
                          return (
                            <div className="p-3 rounded bg-black/20">
                              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Record 4: DKIM 2 CNAME Record
                              </p>
                              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                Type: {record?.type}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  Name: {name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(name, 'dkim2-cname-name')}
                                  className="p-0.5 rounded transition-all hover:bg-white/10"
                                  title="Copy name"
                                >
                                  {copiedField === 'dkim2-cname-name' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                              <div 
                                className="flex items-center gap-1 mb-2 group"
                              >
                                <p className="text-sm font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
                                  Value: {value}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(value, 'dkim2-cname-value')}
                                  className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                  title="Copy value"
                                >
                                  {copiedField === 'dkim2-cname-value' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Record 5: DMARC TXT (constructed) */}
                        {domainDnsRecords?.dmarc_txt && (() => {
                          const record = domainDnsRecords.dmarc_txt
                          const name = record?.name || ''
                          const value = record?.value || ''
                          return (
                            <div className="p-3 rounded bg-black/20">
                              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Record 5: DMARC TXT Record
                              </p>
                              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                                Type: {record?.type}
                              </p>
                              <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                  Name: {name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(name, 'dmarc-txt-name')}
                                  className="p-0.5 rounded transition-all hover:bg-white/10"
                                  title="Copy name"
                                >
                                  {copiedField === 'dmarc-txt-name' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                              <div 
                                className="flex items-center gap-1 mb-2 group"
                              >
                                <p className="text-sm font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
                                  Value: {value}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(value, 'dmarc-txt-value')}
                                  className="p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-white/10"
                                  title="Copy value"
                                >
                                  {copiedField === 'dmarc-txt-value' ? (
                                    <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {!domainDnsRecords && !domainValidationResult?.dns_records && verificationSettings?.domain && (
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            DNS records will be displayed here after domain setup. Click "Test Domain" to validate.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {(!step2Complete || !domainValidationResult?.authenticated) && (
                <div className="mt-4">
                  {canMarkStep2 ? (
                    <>
                      {/* Validation Status Message */}
                      {domainValidationResult && !domainValidationResult.authenticated && (
                        <div className="mb-3 p-2 rounded" style={{ backgroundColor: domainValidationResult.verified ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                          <div className="flex items-center gap-2 text-xs">
                            {domainValidationResult.verified ? (
                              <>
                                <AlertTriangle className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                <span style={{ color: '#3b82f6' }}>Domain is verified. Click "Test Domain to Complete" to authenticate.</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                                <span style={{ color: '#ef4444' }}>Domain is not verified. Please add DNS records to your domain.</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {!domainValidationResult && verificationSettings?.domain && (
                        <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                          <div className="flex items-center gap-2 text-xs">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                            <span style={{ color: '#ef4444' }}>Domain is not verified. Please add DNS records to your domain.</span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!companyId || !verificationSettings?.domain) return
                          const token = getSessionToken()
                          if (!token) return

                          setIsValidatingDomain(true)
                          setDomainError(null)

                          try {
                            const res = await fetch(`/api/companies/${companyId}/verification/domain`, {
                              method: 'GET',
                              headers: { 
                                Authorization: `Bearer ${token}`
                              }
                            })
                            const json = await res.json()
                            
                            if (json?.success) {
                              setDomainValidationResult(json.data)
                              // Update DNS records if they've changed
                              if (json.data?.dns_records) {
                                setDomainDnsRecords(json.data.dns_records)
                              }
                              // If authenticated, mark as complete
                              if (json.data?.authenticated) {
                                await handleMarkStepComplete(2)
                              }
                            } else {
                              setDomainError(json?.error || 'Failed to validate domain')
                              setDomainValidationResult(null)
                              setTimeout(() => setDomainError(null), 8000)
                            }
                          } catch (e: any) {
                            console.error('Failed to validate domain:', e)
                            setDomainError(e.message || 'Failed to validate domain')
                            setDomainValidationResult(null)
                            setTimeout(() => setDomainError(null), 8000)
                          } finally {
                            setIsValidatingDomain(false)
                          }
                        }}
                        disabled={isValidatingDomain || isMarkingStepComplete === 2}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: (isValidatingDomain || isMarkingStepComplete === 2) ? 'var(--hover-bg)' : '#10b981',
                          color: (isValidatingDomain || isMarkingStepComplete === 2) ? 'var(--text-tertiary)' : 'white',
                          cursor: (isValidatingDomain || isMarkingStepComplete === 2) ? 'not-allowed' : 'pointer',
                          opacity: (isValidatingDomain || isMarkingStepComplete === 2) ? 0.5 : 1,
                        }}
                      >
                        {isValidatingDomain || isMarkingStepComplete === 2 ? (
                          <>
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>{isValidatingDomain ? 'Testing Domain...' : 'Marking Complete...'}</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Test Domain to Complete</span>
                          </>
                        )}
                      </button>
                    </>
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
              </>
            )}
          </div>

          {/* Step 3: Configure Email */}
          <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step3Complete ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {step3Complete ? <CheckCircle className="w-5 h-5" /> : '3'}
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Configure Email
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleStepCollapse(3)}
                className="p-1 rounded transition-all"
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
                {collapsedSteps[3] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>

            {!collapsedSteps[3] && (
              <>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Customize the email template that gets sent out for account verification.
              </p>

              <button
                type="button"
                onClick={() => router.push('/dashboard/company/email-template')}
                className="w-full p-4 rounded-lg mb-4 text-left transition-all"
                style={{ 
                  backgroundColor: step3Complete ? 'rgba(16, 185, 129, 0.1)' : 'var(--hover-bg)', 
                  borderColor: step3Complete ? '#10b981' : 'var(--border-color)', 
                  border: `1px solid ${step3Complete ? '#10b981' : 'var(--border-color)'}`,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!step3Complete) {
                    e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!step3Complete) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: step3Complete ? '#10b981' : 'var(--text-primary)' }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold" style={{ color: step3Complete ? '#10b981' : 'var(--text-primary)' }}>
                        Email Configuration
                      </h3>
                      {step3Complete && (
                        <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Configure the email template, subject line, and content for verification emails.
                    </p>
                    <p className="text-xs mt-2 italic" style={{ color: 'var(--text-tertiary)' }}>
                      {step3Complete ? 'Email template configured' : 'Click to customize your email template'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: step3Complete ? '#10b981' : 'var(--text-tertiary)' }} />
                </div>
              </button>

              {!step3Complete && (
                <div className="mt-4">
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
                </div>
              )}
              </>
            )}
          </div>

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
                onClick={handleCreateUpdateSender}
                disabled={isUpdatingSender}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1"
                style={{
                  backgroundColor: isUpdatingSender ? 'var(--hover-bg)' : '#10b981',
                  color: isUpdatingSender ? 'var(--text-tertiary)' : 'white',
                  cursor: isUpdatingSender ? 'not-allowed' : 'pointer',
                  opacity: isUpdatingSender ? 0.5 : 1,
                }}
              >
                {isUpdatingSender ? 'Creating Sender...' : 'Confirm'}
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

        {/* Edit Domain Modal */}
        {showEditDomainModal && verificationSettings?.domain && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => {
              if (!isUpdatingDomain) {
                setShowEditDomainModal(false)
                setNewDomain('')
                setConfirmOldDomain('')
              }
            }}
          >
            <div 
              className="rounded-lg p-6 max-w-md w-full"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Change Domain
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUpdatingDomain) {
                      setShowEditDomainModal(false)
                      setNewDomain('')
                      setConfirmOldDomain('')
                    }
                  }}
                  className="p-1 rounded transition-all hover:bg-white/10"
                  style={{ color: 'var(--text-tertiary)' }}
                  disabled={isUpdatingDomain}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                  <p className="text-sm" style={{ color: '#ef4444' }}>
                    <strong>Warning:</strong> Changing the domain will require you to update all DNS records. Please confirm by retyping the current domain below.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Current Domain
                  </label>
                  <p className="text-sm mb-2 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {verificationSettings.domain}
                  </p>
                  <input
                    type="text"
                    value={confirmOldDomain}
                    onChange={(e) => setConfirmOldDomain(e.target.value)}
                    placeholder="Retype current domain to confirm"
                    disabled={isUpdatingDomain}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--code-bg)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    New Domain
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    disabled={isUpdatingDomain}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--code-bg)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    The domain you want to authenticate (e.g., example.com)
                  </p>
                </div>

                {domainError && (
                  <div className="p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                    <p className="text-sm" style={{ color: '#ef4444' }}>
                      {domainError}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUpdateDomain}
                    disabled={!newDomain.trim() || !confirmOldDomain.trim() || isUpdatingDomain || confirmOldDomain !== verificationSettings.domain}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 flex-1"
                    style={{
                      backgroundColor: (!newDomain.trim() || !confirmOldDomain.trim() || isUpdatingDomain || confirmOldDomain !== verificationSettings.domain) ? 'var(--hover-bg)' : '#ef4444',
                      color: (!newDomain.trim() || !confirmOldDomain.trim() || isUpdatingDomain || confirmOldDomain !== verificationSettings.domain) ? 'var(--text-tertiary)' : 'white',
                      cursor: (!newDomain.trim() || !confirmOldDomain.trim() || isUpdatingDomain || confirmOldDomain !== verificationSettings.domain) ? 'not-allowed' : 'pointer',
                      opacity: (!newDomain.trim() || !confirmOldDomain.trim() || isUpdatingDomain || confirmOldDomain !== verificationSettings.domain) ? 0.5 : 1,
                    }}
                  >
                    {isUpdatingDomain ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Update Domain</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isUpdatingDomain) {
                        setShowEditDomainModal(false)
                        setNewDomain('')
                        setConfirmOldDomain('')
                        setDomainError(null)
                      }
                    }}
                    disabled={isUpdatingDomain}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--card-bg)',
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
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
