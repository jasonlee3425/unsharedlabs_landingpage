'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Key,
  Mail,
  Rocket,
  Server,
  Shield,
  Smartphone,
  X,
  Book,
  ExternalLink,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

type Screen = 'select' | 'coming_soon' | 'nodejs' | 'nextjs'

interface TechStack {
  id: string
  name: string
  category: 'mobile' | 'web-frontend' | 'backend'
  icon: React.ReactNode
  available: boolean
  description: string
}

type NodeStepId = 'credentials' | 'install' | 'initialize' | 'integrate' | 'handle' | 'verification'
type NextjsStepId = 'install' | 'integrate'

type OnboardingState = {
  selectedTechStacks: string[]
  nodejsSteps: Record<NodeStepId, boolean>
  nextjsSteps: Record<NextjsStepId, boolean>
  completedTechStacks?: string[] // Track which tech stacks were completed when onboarding was marked complete
  optIntoVerification?: boolean // Whether user opted into account verification setup
  lastScreen: Screen
}

const DEFAULT_STATE: OnboardingState = {
  selectedTechStacks: [],
  nodejsSteps: {
    credentials: false,
    install: false,
    initialize: false,
    integrate: false,
    handle: false,
    verification: false,
  },
  nextjsSteps: {
    install: false,
    integrate: false,
  },
  optIntoVerification: false,
  lastScreen: 'select',
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const companyId = user?.companyId

  const techStacks: TechStack[] = useMemo(
    () => [
      // Backend
      {
        id: 'nodejs',
        name: 'Node.js (Express)',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: true,
        description: 'JavaScript runtime for backend',
      },
      {
        id: 'python',
        name: 'Python (Django/Flask)',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: false,
        description: 'Python web frameworks',
      },
      {
        id: 'ruby',
        name: 'Ruby (Rails)',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: false,
        description: 'Ruby web framework',
      },
      {
        id: 'php',
        name: 'PHP (Laravel)',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: false,
        description: 'PHP web framework',
      },
      {
        id: 'go',
        name: 'Go',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: false,
        description: 'Go programming language',
      },
      {
        id: 'java',
        name: 'Java (Spring)',
        category: 'backend',
        icon: <Server className="w-6 h-6" />,
        available: false,
        description: 'Java web framework',
      },

      // Web Frontend
      {
        id: 'react',
        name: 'React',
        category: 'web-frontend',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Popular JavaScript framework',
      },
      {
        id: 'vue',
        name: 'Vue.js',
        category: 'web-frontend',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Progressive JavaScript framework',
      },
      {
        id: 'nuxt',
        name: 'Nuxt.js',
        category: 'web-frontend',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Vue.js meta-framework',
      },
        {
          id: 'nextjs',
          name: 'Next.js',
          category: 'web-frontend',
          icon: <Globe className="w-6 h-6" />,
          available: true,
          description: 'React framework for production',
        },
      {
        id: 'angular',
        name: 'Angular',
        category: 'web-frontend',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'TypeScript-based framework',
      },

      // Mobile
      {
        id: 'swift',
        name: 'Swift (iOS)',
        category: 'mobile',
        icon: <Smartphone className="w-6 h-6" />,
        available: false,
        description: 'Native iOS development',
      },
      {
        id: 'android',
        name: 'Android (Kotlin/Java)',
        category: 'mobile',
        icon: <Smartphone className="w-6 h-6" />,
        available: false,
        description: 'Native Android development',
      },
      {
        id: 'react-native',
        name: 'React Native',
        category: 'mobile',
        icon: <Smartphone className="w-6 h-6" />,
        available: false,
        description: 'Cross-platform mobile framework',
      },
      {
        id: 'flutter',
        name: 'Flutter',
        category: 'mobile',
        icon: <Smartphone className="w-6 h-6" />,
        available: false,
        description: 'Cross-platform mobile framework',
      },

      // Miscellaneous (Site Builders)
      {
        id: 'wordpress',
        name: 'WordPress',
        category: 'miscellaneous',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'WordPress CMS and plugins',
      },
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'miscellaneous',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Shopify store integration',
      },
      {
        id: 'webflow',
        name: 'Webflow',
        category: 'miscellaneous',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Webflow site builder',
      },
      {
        id: 'squarespace',
        name: 'Squarespace',
        category: 'miscellaneous',
        icon: <Globe className="w-6 h-6" />,
        available: false,
        description: 'Squarespace site builder',
      },
    ],
    []
  )

  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [screen, setScreen] = useState<Screen>('select')
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({})
  const [dismissedNotifications, setDismissedNotifications] = useState<Record<string, boolean>>({})
  const [showClientId, setShowClientId] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  
  // Account verification state
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationName, setVerificationName] = useState('')
  const [isCreatingSender, setIsCreatingSender] = useState(false)
  const [senderCreated, setSenderCreated] = useState(false)
  const [otp, setOtp] = useState('')
  const [isValidatingOtp, setIsValidatingOtp] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const clientId = user?.companyId || 'your-client-id'

  const selectedTechStacks = state.selectedTechStacks
  const selectedTechObjects = useMemo(
    () => selectedTechStacks.map((id) => techStacks.find((t) => t.id === id)).filter(Boolean) as TechStack[],
    [selectedTechStacks, techStacks]
  )
  const selectedUnsupported = useMemo(() => selectedTechObjects.filter((t) => !t.available), [selectedTechObjects])
  const nodeSelected = selectedTechStacks.includes('nodejs')
  const nextjsSelected = selectedTechStacks.includes('nextjs')
  // Calculate steps - exclude verification step if not opted in
  const optIntoVerification = state.optIntoVerification ?? false
  const nodeStepsToCount = optIntoVerification 
    ? Object.keys(state.nodejsSteps) 
    : Object.keys(state.nodejsSteps).filter(step => step !== 'verification')
  const nodeStepsCompletedCount = nodeStepsToCount.filter(step => state.nodejsSteps[step as NodeStepId]).length
  const nodeStepsTotal = nodeStepsToCount.length
  const nodeProgress = nodeStepsTotal > 0 ? nodeStepsCompletedCount / nodeStepsTotal : 0
  const nodeOnboardingComplete = nodeSelected && nodeStepsCompletedCount === nodeStepsTotal
  
  const nextjsStepsCompletedCount = (Object.values(state.nextjsSteps) as boolean[]).filter(Boolean).length
  const nextjsStepsTotal = Object.keys(state.nextjsSteps).length
  const nextjsProgress = nextjsStepsTotal > 0 ? nextjsStepsCompletedCount / nextjsStepsTotal : 0
  const nextjsOnboardingComplete = nextjsSelected && nextjsStepsCompletedCount === nextjsStepsTotal
  
  // Calculate total steps needed based on selected tech stacks
  const totalStepsNeeded = (nodeSelected ? nodeStepsTotal : 0) + (nextjsSelected ? nextjsStepsTotal : 0)
  const totalStepsCompleted = (nodeSelected ? nodeStepsCompletedCount : 0) + (nextjsSelected ? nextjsStepsCompletedCount : 0)
  const allOnboardingComplete = (!nodeSelected || nodeOnboardingComplete) && (!nextjsSelected || nextjsOnboardingComplete)
  
  // Check if new tech stacks were added after completion
  const completedTechStacks = state.completedTechStacks || []
  const newTechStacks = selectedTechStacks.filter(stack => !completedTechStacks.includes(stack))
  const hasNewIncompleteTechStack = newTechStacks.length > 0 && completedTechStacks.length > 0

  const persist = useCallback(
    async (next: OnboardingState) => {
      if (!companyId) return
      const token = getSessionToken()
      if (!token) return
      try {
        setSaveError(null)
        const res = await fetch(`/api/companies/${companyId}/onboarding`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: next }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || 'Save failed')
        }
      } catch (e) {
        console.error('Failed to save onboarding state:', e)
        setSaveError('Failed to save progress. Please refresh and try again.')
      }
    },
    [companyId]
  )

  // Track if we've already scrolled on this screen to prevent re-scrolling when typing
  const [hasScrolledToIncomplete, setHasScrolledToIncomplete] = useState(false)
  const [lastScreen, setLastScreen] = useState<Screen | null>(null)

  // Scroll to first incomplete step when nodejs or nextjs screen loads (only once per screen)
  useEffect(() => {
    if ((screen !== 'nodejs' && screen !== 'nextjs') || isLoadingOnboarding) return

    // Reset scroll flag when screen changes
    if (lastScreen !== screen) {
      setHasScrolledToIncomplete(false)
      setLastScreen(screen)
    }

    // Only scroll if we haven't already scrolled on this screen, and no input is focused
    if (hasScrolledToIncomplete) return
    
    // Check if any input is currently focused - if so, don't scroll
    const activeElement = document.activeElement
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return
    }

    let firstIncomplete: string | undefined
    if (screen === 'nodejs') {
      const stepOrder: NodeStepId[] = ['credentials', 'install', 'initialize', 'integrate', 'handle', 'verification']
      firstIncomplete = stepOrder.find((stepId) => !state.nodejsSteps[stepId])
    } else if (screen === 'nextjs') {
      const stepOrder: NextjsStepId[] = ['install', 'integrate']
      firstIncomplete = stepOrder.find((stepId) => !state.nextjsSteps[stepId])
    }

    if (firstIncomplete) {
      // Delay to ensure DOM is ready after state loads
      const timeoutId = setTimeout(() => {
        // Double-check no input is focused before scrolling
        const activeElement = document.activeElement
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return
        }
        
        const element = document.getElementById(`step-${firstIncomplete}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Add a slight offset from the top for better visibility
          setTimeout(() => {
            window.scrollBy({ top: -20, behavior: 'smooth' })
          }, 300)
          setHasScrolledToIncomplete(true)
        }
      }, 200)
      return () => clearTimeout(timeoutId)
    } else {
      // All steps complete, mark as scrolled
      setHasScrolledToIncomplete(true)
    }
  }, [screen, isLoadingOnboarding, state.nodejsSteps, state.nextjsSteps, hasScrolledToIncomplete, lastScreen])

  // Check prevention status when opted into verification
  useEffect(() => {
    if (state.optIntoVerification && companyId && screen === 'nodejs') {
      void checkPreventionComplete()
    }
  }, [state.optIntoVerification, companyId, screen])

  useEffect(() => {
    const load = async () => {
      if (!companyId) {
        setIsLoadingOnboarding(false)
        setScreen('select')
        return
      }
      const token = getSessionToken()
      if (!token) {
        setIsLoadingOnboarding(false)
        setScreen('select')
        return
      }

      try {
        setIsLoadingOnboarding(true)
        const res = await fetch(`/api/companies/${companyId}/onboarding`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json?.success) {
          const loaded: OnboardingState = { ...DEFAULT_STATE, ...(json.state || {}) }
          setState(loaded)
          setScreen(loaded.lastScreen || 'select')
          // Store the completed status for notification detection
          if (json.completed) {
            // Onboarding was previously complete
            // We'll check in useEffect if new tech stacks were added
          }
        } else {
          setScreen('select')
        }
      } catch (e) {
        console.error('Failed to load onboarding state:', e)
        setScreen('select')
      } finally {
        setIsLoadingOnboarding(false)
      }
    }

    load()
  }, [companyId])

  useEffect(() => {
    if (screen !== state.lastScreen) {
      const next = { ...state, lastScreen: screen }
      setState(next)
      void persist(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Fetch API key when component loads
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!companyId) return
      const token = getSessionToken()
      if (!token) return

      try {
        const res = await fetch(`/api/companies/${companyId}/api-key`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json?.success && json?.data?.apiKey) {
          setApiKey(json.data.apiKey)
        }
      } catch (e) {
        console.error('Failed to fetch API key:', e)
      }
    }

    fetchApiKey()
  }, [companyId])

  // Generate API key function
  const handleGenerateApiKey = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    setIsGeneratingApiKey(true)
    setApiKeyError(null)

    try {
      const res = await fetch(`/api/companies/${companyId}/api-key`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json?.success && json?.data?.apiKey) {
        setApiKey(json.data.apiKey)
      } else {
        setApiKeyError(json?.error || 'Failed to generate API key')
      }
    } catch (e: any) {
      console.error('Failed to generate API key:', e)
      setApiKeyError(e.message || 'Failed to generate API key')
    } finally {
      setIsGeneratingApiKey(false)
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
        // Mark verification step as complete
        toggleNodeStep('verification')
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

  const toggleTechStack = (techId: string) => {
    const nextSelected = selectedTechStacks.includes(techId)
      ? selectedTechStacks.filter((id) => id !== techId)
      : [...selectedTechStacks, techId]
    const next: OnboardingState = { ...state, selectedTechStacks: nextSelected }
    setState(next)
    void persist(next)
  }

  const handleNextFromSelect = () => {
    if (selectedTechStacks.length === 0) return
    // Prioritize nodejs if both are selected, otherwise go to the selected one
    if (nodeSelected) {
      setScreen('nodejs')
    } else if (nextjsSelected) {
      setScreen('nextjs')
    } else {
      setScreen('coming_soon')
    }
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Check if prevention setup is complete
  const [preventionComplete, setPreventionComplete] = useState<boolean | null>(null)
  const [isCheckingPrevention, setIsCheckingPrevention] = useState(false)

  const checkPreventionComplete = async (): Promise<boolean> => {
    if (!companyId) return false
    const token = getSessionToken()
    if (!token) return false

    try {
      setIsCheckingPrevention(true)
      const res = await fetch(`/api/companies/${companyId}/verification`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json?.success && json.data) {
        const preventionSteps = json.data.prevention_steps || { step1: false, step2: false, step3: false }
        const isVerified = json.data.is_verified || false
        const step1Complete = preventionSteps.step1 || isVerified
        const step2Complete = preventionSteps.step2 || false
        const step3Complete = preventionSteps.step3 || false
        const complete = step1Complete && step2Complete && step3Complete
        setPreventionComplete(complete)
        return complete
      }
      setPreventionComplete(false)
      return false
    } catch (e) {
      console.error('Failed to check prevention status:', e)
      setPreventionComplete(false)
      return false
    } finally {
      setIsCheckingPrevention(false)
    }
  }

  const toggleNodeStep = async (stepId: NodeStepId) => {
    // Only allow marking as complete, not uncompleting
    if (state.nodejsSteps[stepId]) return
    
    // Enforce sequential completion
    if (stepId === 'verification') {
      // Verification step requires prevention to be complete if opted in
      if (state.optIntoVerification) {
        const isComplete = await checkPreventionComplete()
        if (!isComplete) {
          // Show error or redirect to prevention page
          alert('Please complete all prevention steps before marking this step as complete.')
          return
        }
      } else {
        // Not opted in, cannot complete
        return
      }
    } else {
      const stepOrder: NodeStepId[] = ['credentials', 'install', 'initialize', 'integrate', 'handle']
      const currentIndex = stepOrder.indexOf(stepId)
      
      // Check if previous step is completed (or if this is the first step)
      if (currentIndex > 0) {
        const previousStep = stepOrder[currentIndex - 1]
        if (!state.nodejsSteps[previousStep]) {
          // Previous step not completed, don't allow this step
          return
        }
      }
    }
    
    const nextSteps = { ...state.nodejsSteps, [stepId]: true }
    const next: OnboardingState = { ...state, nodejsSteps: nextSteps }
    setState(next)
    void persist(next)
  }

  const toggleNextjsStep = (stepId: NextjsStepId) => {
    // Only allow marking as complete, not uncompleting
    if (state.nextjsSteps[stepId]) return
    
    // Enforce sequential completion
    const stepOrder: NextjsStepId[] = ['install', 'integrate']
    const currentIndex = stepOrder.indexOf(stepId)
    
    // Check if previous step is completed (or if this is the first step)
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1]
      if (!state.nextjsSteps[previousStep]) {
        // Previous step not completed, don't allow this step
        return
      }
    }
    
    const nextSteps = { ...state.nextjsSteps, [stepId]: true }
    const next: OnboardingState = { ...state, nextjsSteps: nextSteps }
    setState(next)
    void persist(next)
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const CopyButton = ({ text, field, label }: { text: string; field: string; label: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, field)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
      style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--active-bg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
      }}
    >
      {copiedField === field ? (
        <>
          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy {label}</span>
        </>
      )}
    </button>
  )

  const TechCard = ({ tech }: { tech: TechStack }) => {
    const isSelected = selectedTechStacks.includes(tech.id)
    return (
      <button
        type="button"
        onClick={() => toggleTechStack(tech.id)}
        className="p-6 rounded-lg border-2 text-left transition-all relative group w-full"
        style={{
          backgroundColor: isSelected ? 'var(--hover-bg)' : 'var(--card-bg)',
          borderColor: isSelected ? '#10b981' : 'var(--border-strong)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
          e.currentTarget.style.borderColor = isSelected ? '#10b981' : 'var(--border-color)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isSelected ? 'var(--hover-bg)' : 'var(--card-bg)'
          e.currentTarget.style.borderColor = isSelected ? '#10b981' : 'var(--border-strong)'
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--active-bg)' }}>
            {tech.icon}
          </div>
          {tech.available ? (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            >
              <CheckCircle className="w-3 h-3" />
              <span>Available</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}
            >
              <Clock className="w-3 h-3" />
              <span>Coming Soon</span>
            </div>
          )}
        </div>
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {tech.name}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {tech.description}
        </p>
        {isSelected && (
          <div className="absolute top-3 left-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981', color: 'white' }}>
              <Check className="w-4 h-4" />
            </div>
          </div>
        )}
      </button>
    )
  }

  const StepCard = ({
    stepId,
    stepNumber,
    title,
    description,
    children,
    stackType = 'nodejs',
  }: {
    stepId: NodeStepId | NextjsStepId
    stepNumber: number
    title: string
    description: string
    children: React.ReactNode
    stackType?: 'nodejs' | 'nextjs'
  }) => {
    const isCompleted = stackType === 'nodejs' 
      ? Boolean(state.nodejsSteps[stepId as NodeStepId])
      : Boolean(state.nextjsSteps[stepId as NextjsStepId])
    
    // Create a unique key for this step (stackType + stepId)
    const stepKey = `${stackType}-${stepId}`
    const isCollapsed = collapsedSteps[stepKey] ?? false
    
    // Toggle collapse state for this specific step
    const toggleCollapse = () => {
      setCollapsedSteps(prev => ({
        ...prev,
        [stepKey]: !prev[stepKey]
      }))
    }
    
    // Check if this step can be completed (sequential enforcement)
    const canComplete = (() => {
      if (isCompleted) return false // Already completed
      
      // If verification step and not opted in, cannot complete
      if (stepId === 'verification' && !(state.optIntoVerification ?? false)) {
        return false
      }
      
      if (stackType === 'nodejs') {
        const stepOrder: NodeStepId[] = ['credentials', 'install', 'initialize', 'integrate', 'handle', 'verification']
        const currentIndex = stepOrder.indexOf(stepId as NodeStepId)
        if (currentIndex === 0) return true // First step
        // Verification step requires prevention to be complete if opted in
        if (stepId === 'verification') {
          // Return true if prevention is complete (will be checked async in handleToggle)
          return preventionComplete === true
        }
        const previousStep = stepOrder[currentIndex - 1]
        return Boolean(state.nodejsSteps[previousStep])
      } else {
        const stepOrder: NextjsStepId[] = ['install', 'integrate']
        const currentIndex = stepOrder.indexOf(stepId as NextjsStepId)
        if (currentIndex === 0) return true // First step
        const previousStep = stepOrder[currentIndex - 1]
        return Boolean(state.nextjsSteps[previousStep])
      }
    })()
    
    const handleToggle = async () => {
      if (!canComplete) return
      if (stackType === 'nodejs') {
        await toggleNodeStep(stepId as NodeStepId)
      } else {
        toggleNextjsStep(stepId as NextjsStepId)
      }
    }

    return (
      <div
        id={`step-${stepId}`}
        className="p-6 rounded-lg border-2 transition-all"
        style={{
          backgroundColor: isCompleted ? 'var(--hover-bg)' : 'var(--card-bg)',
          borderColor: isCompleted ? 'var(--border-color)' : 'var(--border-strong)',
          opacity: isCompleted ? 0.85 : 1,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
            style={{
              backgroundColor: isCompleted ? '#10b981' : 'var(--active-bg)',
              color: isCompleted ? 'white' : 'var(--text-primary)',
            }}
          >
            {isCompleted ? <CheckCircle className="w-6 h-6" /> : stepNumber}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                {isCompleted && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    Completed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <button
                    type="button"
                    onClick={toggleCollapse}
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
                    title={isCollapsed ? 'Expand step' : 'Collapse step'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                )}
                {!isCompleted && (
                  <>
                    {/* Hide "Mark as Complete" for verification step if not opted in */}
                    {stepId === 'verification' && !(state.optIntoVerification ?? false) ? null : (
                      <button
                        type="button"
                        onClick={handleToggle}
                        disabled={!canComplete || isCheckingPrevention}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: canComplete && !isCheckingPrevention ? '#10b981' : 'var(--hover-bg)',
                          color: canComplete && !isCheckingPrevention ? 'white' : 'var(--text-tertiary)',
                          cursor: canComplete && !isCheckingPrevention ? 'pointer' : 'not-allowed',
                          opacity: canComplete && !isCheckingPrevention ? 1 : 0.5,
                        }}
                        onMouseEnter={(e) => {
                          if (canComplete && !isCheckingPrevention) {
                            e.currentTarget.style.backgroundColor = '#059669'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (canComplete && !isCheckingPrevention) {
                            e.currentTarget.style.backgroundColor = '#10b981'
                          }
                        }}
                        title={!canComplete ? 'Complete previous steps first' : ''}
                      >
                        {isCheckingPrevention ? (
                          <>
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark as Complete</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {description}
            </p>
            {(!isCompleted || !isCollapsed) && children}
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingOnboarding) {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Onboarding
              </h1>
            </div>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading your onboarding progress…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (screen === 'select') {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Select Your Tech Stack
              </h1>
            </div>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Choose one or more stacks. If you pick multiple, we’ll combine them into one onboarding flow.
            </p>
          </div>

          {hasNewIncompleteTechStack && !dismissedNotifications['new-tech-stack-select'] && (
            <div
              className="mb-6 p-4 rounded-lg border-2 flex items-start gap-3 relative"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  New Tech Stack Added
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  You've added {newTechStacks.map(id => techStacks.find(t => t.id === id)?.name).filter(Boolean).join(', ')} to your tech stack. 
                  Complete onboarding for this {newTechStacks.length === 1 ? 'stack' : 'stack'} to continue viewing dashboard data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissedNotifications(prev => ({ ...prev, 'new-tech-stack-select': true }))}
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
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {saveError && (
            <div
              className="mb-6 p-4 rounded-lg border-2"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {saveError}
              </p>
            </div>
          )}

          <div className="space-y-8">
            {/* Backend */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Server className="w-5 h-5" />
                Backend
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techStacks.filter((t) => t.category === 'backend').map((tech) => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
              </div>
            </div>

            {/* Web Frontend */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Globe className="w-5 h-5" />
                Web Frontend
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techStacks.filter((t) => t.category === 'web-frontend').map((tech) => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Smartphone className="w-5 h-5" />
                Mobile Development
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techStacks.filter((t) => t.category === 'mobile').map((tech) => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
              </div>
            </div>

            {/* Miscellaneous */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Globe className="w-5 h-5" />
                Miscellaneous
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                Site builders and CMS platforms
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {techStacks.filter((t) => t.category === 'miscellaneous').map((tech) => (
                  <TechCard key={tech.id} tech={tech} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Selected: <span style={{ color: 'var(--text-primary)' }}>{selectedTechStacks.length}</span>
            </div>
            <button
              type="button"
              onClick={handleNextFromSelect}
              disabled={selectedTechStacks.length === 0}
              className="px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#10b981', color: 'white' }}
              onMouseEnter={(e) => {
                if (!selectedTechStacks.length) return
                e.currentTarget.style.backgroundColor = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981'
              }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (screen === 'nextjs') {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Onboarding
                  </h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Next.js Integration Guide
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {nextjsSelected && screen === 'nextjs' && (
                  <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Next.js Guide
                  </span>
                )}
                {nodeSelected && screen === 'nextjs' && (
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('nodejs')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="px-4 py-2 rounded-lg border-2 text-sm transition-all"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                    }}
                  >
                    Node.js Guide
                  </button>
                )}
                {selectedUnsupported.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScreen('coming_soon')}
                    className="px-4 py-2 rounded-lg border-2 text-sm transition-all"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                    }}
                  >
                    Other stacks (Coming Soon)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScreen('select')}
                  className="px-4 py-2 rounded-lg border-2 text-sm transition-all"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                  }}
                >
                  Update Stack
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-tertiary)' }}>
              Follow this step-by-step checklist to integrate account sharing detection into your Next.js application.
            </p>

            <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                <span>
                  <strong>Tip:</strong> Click the <strong>"Mark as Complete"</strong> button on each step after you've finished it to track your progress.
                </span>
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>
                Progress: <span style={{ color: 'var(--text-primary)' }}>{nextjsStepsCompletedCount}</span> of{' '}
                <span style={{ color: 'var(--text-primary)' }}>{nextjsStepsTotal}</span> steps completed
              </span>
              <div className="flex-1 h-2 rounded-full max-w-xs" style={{ backgroundColor: 'var(--border-color)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: '#10b981', width: `${Math.round(nextjsProgress * 100)}%` }} />
              </div>
              {nextjsOnboardingComplete && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  Complete
                </span>
              )}
              {(selectedTechStacks.length > 1 || allOnboardingComplete) && (
                <button
                  type="button"
                  onClick={() => {
                    if (allOnboardingComplete) {
                      router.push('/dashboard')
                    } else if (screen === 'nextjs' && nodeSelected) {
                      setScreen('nodejs')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    } else if (screen === 'nodejs' && nextjsSelected) {
                      setScreen('nextjs')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm ml-4"
                  style={{ backgroundColor: allOnboardingComplete ? '#10b981' : '#3b82f6', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = allOnboardingComplete ? '#059669' : '#2563eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = allOnboardingComplete ? '#10b981' : '#3b82f6'
                  }}
                >
                  {allOnboardingComplete ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : screen === 'nextjs' && nodeSelected ? (
                    <>
                      Continue with Node.js
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : screen === 'nodejs' && nextjsSelected ? (
                    <>
                      Continue with Next.js
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : null}
                </button>
              )}
            </div>
          </div>

          {saveError && (
            <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }}>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {saveError}
              </p>
            </div>
          )}

          {!nextjsSelected && (
            <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                You're viewing the Next.js guide, but Next.js isn't selected. Go back and select <strong>Next.js</strong> to track progress.
              </p>
            </div>
          )}

          {/* Incomplete Steps */}
          <div className="space-y-4">
            {!state.nextjsSteps.install && (
              <StepCard stepId="install" stepNumber={1} title="Install the SDK" description="Install the Unshared Labs SDK in your Next.js project" stackType="nextjs">
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Install the Unshared Labs SDK using npm or yarn.
                </p>
                <div className="p-4 rounded-lg font-mono text-sm relative group" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <code style={{ color: 'var(--text-primary)' }}>npm install unshared-clientjs-sdk</code>
                    <CopyButton text="npm install unshared-clientjs-sdk" field="nextjsInstallCmd" label="Command" />
                  </div>
                </div>
              </div>
            </StepCard>
            )}

            {!state.nextjsSteps.integrate && (
              <StepCard stepId="integrate" stepNumber={2} title="Integrate Event Tracking" description="Add event tracking to your Next.js API routes to detect account sharing" stackType="nextjs">
              <div className="space-y-4">
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                  <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Tip:</strong> For complete examples and API reference, check the <strong>Documentation</strong> tab in the sidebar.
                    </span>
                  </p>
                </div>

                {/* Function Signature */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                  <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        processUserEvent()
                      </span>
                      <CopyButton
                        text={`processUserEvent(\n  eventType: string,\n  userId: string,\n  ipAddress: string,\n  deviceId: string,\n  sessionHash: string,\n  userAgent: string,\n  emailAddress: string,\n  subscriptionStatus?: string | null,\n  eventDetails?: Map<string, any> | null\n): Promise<any>`}
                        field="nextjsEventSignature"
                        label="Signature"
                      />
                    </div>
                    <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`processUserEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  emailAddress: string,
  subscriptionStatus?: string | null,
  eventDetails?: Map<string, any> | null
): Promise<any>`}</pre>
                  </div>
                </div>

                {/* Parameters */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventType</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                      <div className="text-xs mt-1">The type of event (e.g., 'login', 'signup', 'page_view', 'content_access')</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>ipAddress</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                      <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-forwarded-for')</code> or <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-real-ip')</code></div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                      <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-device-id')</code></div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>sessionHash</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                      <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-session-hash')</code></div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userAgent</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                      <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('user-agent')</code></div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>subscriptionStatus</div>
                      <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string | null</code> (optional)</div>
                      <div className="text-xs mt-1">Values: 'paid', 'free', 'free trial', 'discounted', or 'other'</div>
                    </div>
                  </div>
                </div>

                {/* Example */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example: Next.js API Route</h4>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Add event tracking in your Next.js API routes (e.g., <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>/app/api/auth/login/route.ts</code>).
                  </p>
                  <div className="p-4 rounded-lg font-mono text-sm relative" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Next.js API Route</span>
                      <CopyButton text={`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  const result = await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }
  
  return Response.json({ success: true })
}`} field="nextjsIntegrate" label="Code" />
                    </div>
                    <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
{`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  const result = await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }
  
  return Response.json({ success: true })
}`}
                    </pre>
                  </div>
                </div>

                {/* Response Structure */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                  <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Response Object
                      </span>
                      <CopyButton
                        text={`{\n  "success": true,\n  "event": {\n    "data": [...],\n    "status": "success"\n  },\n  "analysis": {\n    "status": "success",\n    "is_user_flagged": true\n  }\n}`}
                        field="nextjsEventResponse"
                        label="Response"
                      />
                    </div>
                    <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "event": {
    "data": [...],
    "status": "success"
  },
  "analysis": {
    "status": "success",
    "is_user_flagged": true
  }
}`}</pre>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Check <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>result.analysis.is_user_flagged</code> to determine if the user should be verified. See the <strong>Documentation</strong> tab for handling flagged users.
                  </p>
                </div>
              </div>
            </StepCard>
            )}
          </div>

          {/* Completed Tasks Section for Next.js */}
          {(state.nextjsSteps.install || state.nextjsSteps.integrate) && (
            <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                Completed Tasks
              </h2>
              <div className="space-y-4">
                {state.nextjsSteps.install && (
                  <StepCard stepId="install" stepNumber={1} title="Install the SDK" description="Install the Unshared Labs SDK in your Next.js project" stackType="nextjs">
                    <div className="space-y-4">
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Install the Unshared Labs SDK using npm or yarn.
                      </p>
                      <div className="p-4 rounded-lg font-mono text-sm relative group" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                          <code style={{ color: 'var(--text-primary)' }}>npm install unshared-clientjs-sdk</code>
                          <CopyButton text="npm install unshared-clientjs-sdk" field="nextjsInstallCmd" label="Command" />
                        </div>
                      </div>
                    </div>
                  </StepCard>
                )}

                {state.nextjsSteps.integrate && (
                  <StepCard stepId="integrate" stepNumber={2} title="Integrate Event Tracking" description="Add event tracking to your Next.js API routes to detect account sharing" stackType="nextjs">
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                        <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                          <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Tip:</strong> For complete examples and API reference, check the <strong>Documentation</strong> tab in the sidebar.
                          </span>
                        </p>
                      </div>

                      {/* Function Signature */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                        <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              processUserEvent()
                            </span>
                            <CopyButton
                              text={`processUserEvent(\n  eventType: string,\n  userId: string,\n  ipAddress: string,\n  deviceId: string,\n  sessionHash: string,\n  userAgent: string,\n  emailAddress: string,\n  subscriptionStatus?: string | null,\n  eventDetails?: Map<string, any> | null\n): Promise<any>`}
                              field="nextjsEventSignature"
                              label="Signature"
                            />
                          </div>
                          <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`processUserEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  emailAddress: string,
  subscriptionStatus?: string | null,
  eventDetails?: Map<string, any> | null
): Promise<any>`}</pre>
                        </div>
                      </div>

                      {/* Parameters */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                        <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventType</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                            <div className="text-xs mt-1">The type of event (e.g., 'login', 'signup', 'page_view', 'content_access')</div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>ipAddress</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                            <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-forwarded-for')</code> or <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-real-ip')</code></div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                            <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-device-id')</code></div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>sessionHash</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                            <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('x-session-hash')</code></div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userAgent</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                            <div className="text-xs mt-1">Get from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers.get('user-agent')</code></div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                            <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>subscriptionStatus</div>
                            <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string | null</code> (optional)</div>
                            <div className="text-xs mt-1">Values: 'paid', 'free', 'free trial', 'discounted', or 'other'</div>
                          </div>
                        </div>
                      </div>

                      {/* Example */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example: Next.js API Route</h4>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          Add event tracking in your Next.js API routes (e.g., <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>/app/api/auth/login/route.ts</code>).
                        </p>
                        <div className="p-4 rounded-lg font-mono text-sm relative" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Next.js API Route</span>
                            <CopyButton text={`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  const result = await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }
  
  return Response.json({ success: true })
}`} field="nextjsIntegrate" label="Code" />
                          </div>
                          <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
{`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  const result = await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }
  
  return Response.json({ success: true })
}`}
                          </pre>
                        </div>
                      </div>

                      {/* Response Structure */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                        <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Response Object
                            </span>
                            <CopyButton
                              text={`{\n  "success": true,\n  "event": {\n    "data": [...],\n    "status": "success"\n  },\n  "analysis": {\n    "status": "success",\n    "is_user_flagged": true\n  }\n}`}
                              field="nextjsEventResponse"
                              label="Response"
                            />
                          </div>
                          <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "event": {
    "data": [...],
    "status": "success"
  },
  "analysis": {
    "status": "success",
    "is_user_flagged": true
  }
}`}</pre>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Check <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>result.analysis.is_user_flagged</code> to determine if the user should be verified. See the <strong>Documentation</strong> tab for handling flagged users.
                        </p>
                      </div>
                    </div>
                  </StepCard>
                )}
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    )
  }

  if (screen === 'coming_soon') {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Clock className="w-10 h-10" style={{ color: '#f59e0b' }} />
              </div>
              <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Coming Soon
              </h1>
              <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                We’re still building SDK support for:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedUnsupported.map((t) => (
                  <span key={t.id} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                    {t.name}
                  </span>
                ))}
              </div>
              <p className="mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Want early access? Email{' '}
                <a href="mailto:support@unsharedlabs.com" className="underline" style={{ color: 'var(--text-primary)' }}>
                  support@unsharedlabs.com
                </a>
                .
              </p>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                type="button"
                onClick={() => setScreen('select')}
                className="px-6 py-3 rounded-lg border-2 transition-all"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                }}
              >
                Back to Selection
              </button>
              {nodeSelected && (
                <button
                  type="button"
                  onClick={() => setScreen('nodejs')}
                  className="px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  }}
                >
                  Continue with Node.js
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {nextjsSelected && (
                <button
                  type="button"
                  onClick={() => setScreen('nextjs')}
                  className="px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  }}
                >
                  Continue with Next.js
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (screen === 'nodejs') {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Onboarding
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {screen === 'nodejs' && 'Node.js Integration Guide'}
                  {screen === 'nextjs' && 'Next.js Integration Guide'}
                </p>
              </div>
            </div>
              <div className="flex items-center gap-2">
                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-2 rounded-lg p-1" style={{ borderColor: 'var(--border-strong)' }}>
                  {nodeSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreen('nodejs')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                      style={{
                        backgroundColor: screen === 'nodejs' ? 'var(--active-bg)' : 'transparent',
                        color: screen === 'nodejs' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                      }}
                      onMouseEnter={(e) => {
                        if (screen !== 'nodejs') {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (screen !== 'nodejs') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      Node.js
                    </button>
                  )}
                  {nextjsSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreen('nextjs')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                      style={{
                        backgroundColor: screen === 'nextjs' ? 'var(--active-bg)' : 'transparent',
                        color: screen === 'nextjs' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                      }}
                      onMouseEnter={(e) => {
                        if (screen !== 'nextjs') {
                          e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (screen !== 'nextjs') {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      Next.js
                    </button>
                  )}
                </div>
                {selectedUnsupported.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScreen('coming_soon')}
                    className="px-4 py-2 rounded-lg border-2 text-sm transition-all"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                    }}
                  >
                    Other stacks (Coming Soon)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setScreen('select')}
                  className="px-4 py-2 rounded-lg border-2 text-sm transition-all"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                  }}
                >
                  Update Stack
                </button>
              </div>
          </div>

          {hasNewIncompleteTechStack && !dismissedNotifications['new-tech-stack-nodejs'] && (
            <div
              className="mb-6 p-4 rounded-lg border-2 flex items-start gap-3 relative"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  New Tech Stack Added
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  You've added {newTechStacks.map(id => techStacks.find(t => t.id === id)?.name).filter(Boolean).join(', ')} to your tech stack. 
                  Complete onboarding for this {newTechStacks.length === 1 ? 'stack' : 'stack'} to continue viewing dashboard data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissedNotifications(prev => ({ ...prev, 'new-tech-stack-nodejs': true }))}
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
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <p style={{ color: 'var(--text-tertiary)' }}>
            Follow this step-by-step checklist to integrate account sharing detection into your platform.
          </p>

          <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
              <span>
                <strong>Tip:</strong> Click the <strong>"Mark as Complete"</strong> button on each step after you've finished it to track your progress.
              </span>
            </p>
          </div>

            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>
                Progress: <span style={{ color: 'var(--text-primary)' }}>{totalStepsCompleted}</span> of{' '}
                <span style={{ color: 'var(--text-primary)' }}>{totalStepsNeeded}</span> steps completed
                {selectedTechStacks.length > 1 && (
                  <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>
                    ({nodeStepsCompletedCount}/{nodeStepsTotal} Node.js)
                  </span>
                )}
              </span>
              <div className="flex-1 h-2 rounded-full max-w-xs" style={{ backgroundColor: 'var(--border-color)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: '#10b981', width: `${totalStepsNeeded > 0 ? Math.round((totalStepsCompleted / totalStepsNeeded) * 100) : 0}%` }} />
              </div>
              {allOnboardingComplete && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  Complete
                </span>
              )}
              {(selectedTechStacks.length > 1 || allOnboardingComplete) && (
                <button
                  type="button"
                  onClick={() => {
                    if (allOnboardingComplete) {
                      router.push('/dashboard')
                    } else if (screen === 'nodejs' && nextjsSelected) {
                      setScreen('nextjs')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    } else if (screen === 'nextjs' && nodeSelected) {
                      setScreen('nodejs')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm ml-4"
                  style={{ backgroundColor: allOnboardingComplete ? '#10b981' : '#3b82f6', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = allOnboardingComplete ? '#059669' : '#2563eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = allOnboardingComplete ? '#10b981' : '#3b82f6'
                  }}
                >
                  {allOnboardingComplete ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : screen === 'nodejs' && nextjsSelected ? (
                    <>
                      Continue with Next.js
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : screen === 'nextjs' && nodeSelected ? (
                    <>
                      Continue with Node.js
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : null}
                </button>
              )}
            </div>
        </div>

          {saveError && (
            <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: '#ef4444' }}>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {saveError}
              </p>
            </div>
          )}

          {!nodeSelected && (
          <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              You’re viewing the Node.js guide, but Node.js isn’t selected. Go back and select <strong>Node.js (Express)</strong> to track progress.
            </p>
          </div>
        )}

        {/* Incomplete Steps */}
        <div className="space-y-4">
          {!state.nodejsSteps.credentials && (
            <StepCard stepId="credentials" stepNumber={1} title="Get Your API Credentials" description="Copy your Client ID and API Key">
              <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Client ID
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClientId(!showClientId)}
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
                      title={showClientId ? 'Hide Client ID' : 'Show Client ID'}
                    >
                      {showClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <CopyButton text={clientId} field="clientId" label="Client ID" />
                  </div>
                </div>
                <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                  {showClientId ? clientId : '•'.repeat(clientId.length)}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      API Key
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apiKey && (
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
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
                        title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    {apiKey && <CopyButton text={apiKey} field="apiKey" label="API Key" />}
                  </div>
                </div>
                {apiKey ? (
                  <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                    {showApiKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 50))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No API key generated yet. Click the button below to generate one.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateApiKey}
                      disabled={isGeneratingApiKey}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: isGeneratingApiKey ? 'var(--hover-bg)' : '#10b981',
                        color: isGeneratingApiKey ? 'var(--text-tertiary)' : 'white',
                        cursor: isGeneratingApiKey ? 'not-allowed' : 'pointer',
                        opacity: isGeneratingApiKey ? 0.5 : 1,
                      }}
                    >
                      {isGeneratingApiKey ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Generate API Key</span>
                        </>
                      )}
                    </button>
                    {apiKeyError && (
                      <p className="text-sm" style={{ color: '#ef4444' }}>
                        {apiKeyError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Security Note:</strong> Keep your API key secure and never commit it to version control. Store it in environment variables.
                </p>
              </div>
            </div>
          </StepCard>
          )}

          {!state.nodejsSteps.install && (
            <StepCard stepId="install" stepNumber={2} title="Install the SDK" description="Install the Unshared Labs Node.js SDK">
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Install the SDK in your backend app.
              </p>
              <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <code style={{ color: 'var(--text-primary)' }}>npm install unshared-clientjs-sdk</code>
                  <CopyButton text="npm install unshared-clientjs-sdk" field="installCmd" label="Command" />
                </div>
              </div>
            </div>
          </StepCard>
          )}

          {!state.nodejsSteps.initialize && (
            <StepCard stepId="initialize" stepNumber={3} title="Initialize the SDK" description="Set up the SDK in your backend code">
              <div className="space-y-4">
              <div className="p-4 rounded-lg font-mono text-sm overflow-hidden" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Environment Variables
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClientId(!showClientId)
                        setShowApiKey(!showApiKey)
                      }}
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
                      title={showClientId && showApiKey ? 'Hide credentials' : 'Show credentials'}
                    >
                      {(showClientId && showApiKey) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <CopyButton text={`UNSHARED_LABS_CLIENT_ID=${clientId}\nUNSHARED_LABS_API_KEY=${apiKey || 'your-api-key-here'}`} field="env" label=".env" />
                  </div>
                </div>
                <pre className="break-all" style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                  {`UNSHARED_LABS_CLIENT_ID=${showClientId ? clientId : '•'.repeat(clientId.length)}\nUNSHARED_LABS_API_KEY=${showApiKey ? (apiKey || 'your-api-key-here') : '•'.repeat(Math.min((apiKey || 'your-api-key-here').length, 50))}`}
                </pre>
              </div>

              <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    TypeScript/JavaScript
                  </span>
                  <CopyButton
                    text={`const unshared_labs_client = new UnsharedLabsClient({\n  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,\n  apiKey: process.env.UNSHARED_LABS_API_KEY!\n});`}
                    field="init"
                    label="Code"
                  />
                </div>
                <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{`const unshared_labs_client = new UnsharedLabsClient({\n  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,\n  apiKey: process.env.UNSHARED_LABS_API_KEY!\n});`}</pre>
              </div>
            </div>
          </StepCard>
          )}

          {!state.nodejsSteps.integrate && (
            <StepCard stepId="integrate" stepNumber={4} title="Integrate Event Tracking" description="Send key events like login/signup/content access to detect account sharing">
              <div className="space-y-4">
              <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> For complete examples and API reference, check the <strong>Documentation</strong> tab in the sidebar.
                  </span>
                </p>
              </div>

              {/* Function Signature */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      processUserEvent()
                    </span>
                    <CopyButton
                      text={`processUserEvent(\n  eventType: string,\n  userId: string,\n  ipAddress: string,\n  deviceId: string,\n  sessionHash: string,\n  userAgent: string,\n  emailAddress: string,\n  subscriptionStatus?: string | null,\n  eventDetails?: Map<string, any> | null\n): Promise<any>`}
                      field="eventSignature"
                      label="Signature"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`processUserEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  emailAddress: string,
  subscriptionStatus?: string | null,
  eventDetails?: Map<string, any> | null
): Promise<any>`}</pre>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventType</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">The type of event (e.g., 'login', 'signup', 'page_view', 'content_access')</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userId</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">Unique identifier for the user</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>ipAddress</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">User's IP address (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.ip</code> or <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-forwarded-for']</code>)</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">Unique device identifier (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-device-id']</code>)</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>sessionHash</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">Session identifier (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-session-hash']</code>)</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userAgent</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">Browser user agent string (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['user-agent']</code>)</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>emailAddress</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">User's email address</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>subscriptionStatus</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string | null</code> (optional)</div>
                    <div className="text-xs mt-1">Subscription status: 'paid', 'free', 'free trial', 'discounted', or 'other'</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventDetails</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>Map&lt;string, any&gt; | null</code> (optional)</div>
                    <div className="text-xs mt-1">Additional event metadata (e.g., <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>new Map([['source', 'web']])</code>)</div>
                  </div>
                </div>
              </div>

              {/* Example */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example: Login Event</h4>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Express.js Route Handler
                    </span>
                    <CopyButton
                      text={`app.post("/login", async (req, res) => {\n  const { userId, emailAddress } = req.body;\n\n  const result = await unshared_labs_client.processUserEvent(\n    "login",\n    userId,\n    req.ip,\n    req.headers["x-device-id"]?.toString() || "unknown-device",\n    req.headers["x-session-hash"]?.toString() || "unknown-session",\n    req.headers["user-agent"] || "",\n    emailAddress,\n    "paid"\n  );\n\n  if (result.analysis.is_user_flagged) {\n    // Handle flagged user\n  }\n\n  res.status(200).json({ message: "Login successful" });\n});`}
                      field="eventExample"
                      label="Code"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`app.post("/login", async (req, res) => {
  const { userId, emailAddress } = req.body;

  const result = await unshared_labs_client.processUserEvent(
    "login",
    userId,
    req.ip,
    req.headers["x-device-id"]?.toString() || "unknown-device",
    req.headers["x-session-hash"]?.toString() || "unknown-session",
    req.headers["user-agent"] || "",
    emailAddress,
    "paid"
  );

  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }

  res.status(200).json({ message: "Login successful" });
});`}</pre>
                </div>
              </div>

              {/* Response Structure */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Response Object
                    </span>
                    <CopyButton
                      text={`{\n  "success": true,\n  "event": {\n    "data": [...],\n    "status": "success"\n  },\n  "analysis": {\n    "status": "success",\n    "is_user_flagged": true\n  }\n}`}
                      field="eventResponse"
                      label="Response"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "event": {
    "data": [...],
    "status": "success"
  },
  "analysis": {
    "status": "success",
    "is_user_flagged": true
  }
}`}</pre>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Check <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>result.analysis.is_user_flagged</code> to determine if the user should be verified.
                </p>
              </div>
            </div>
          </StepCard>
          )}

          {!state.nodejsSteps.handle && (
            <StepCard stepId="handle" stepNumber={5} title="Handle Flagged Users" description="Trigger email verification when a user is flagged for potential account sharing">
              <div className="space-y-4">
              {/* Function Signature */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      triggerEmailVerification()
                    </span>
                    <CopyButton
                      text={`triggerEmailVerification(\n  emailAddress: string,\n  deviceId: string\n): Promise<any>`}
                      field="triggerSignature"
                      label="Signature"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`triggerEmailVerification(
  emailAddress: string,
  deviceId: string
): Promise<any>`}</pre>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>emailAddress</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">The email address of the flagged user to send verification code to</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                    <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                    <div className="text-xs mt-1">The device identifier associated with the flagged user</div>
                  </div>
                </div>
              </div>

              {/* Complete Example */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Complete Example</h4>
                <div className="p-4 rounded-lg font-mono text-sm overflow-hidden" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Express.js Route Handler
                    </span>
                    <CopyButton
                      text={`app.post("/login", async (req, res) => {\n  const { userId, emailAddress } = req.body;\n\n  const result = await unshared_labs_client.processUserEvent(\n    "login",\n    userId,\n    req.ip,\n    req.headers["x-device-id"]?.toString() || "unknown-device",\n    req.headers["x-session-hash"]?.toString() || "unknown-session",\n    req.headers["user-agent"] || "",\n    emailAddress,\n    "paid"\n  );\n\n  if (result.analysis.is_user_flagged) {\n    // Trigger email verification\n    await unshared_labs_client.triggerEmailVerification(\n      emailAddress,\n      req.headers["x-device-id"]?.toString() || "unknown-device"\n    );\n    return res.status(200).json({ \n      message: "Verification required",\n      requiresVerification: true \n    });\n  }\n\n  res.status(200).json({ message: "Login successful" });\n});`}
                      field="flaggedExample"
                      label="Code"
                    />
                  </div>
                  <pre className="break-all overflow-x-auto" style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '100%', fontSize: '0.75rem' }}>{`app.post("/login", async (req, res) => {
  const { userId, emailAddress } = req.body;

  const result = await unshared_labs_client.processUserEvent(
    "login",
    userId,
    req.ip,
    req.headers["x-device-id"]?.toString() || "unknown-device",
    req.headers["x-session-hash"]?.toString() || "unknown-session",
    req.headers["user-agent"] || "",
    emailAddress,
    "paid"
  );

  if (result.analysis.is_user_flagged) {
    // Trigger email verification
    await unshared_labs_client.triggerEmailVerification(
      emailAddress,
      req.headers["x-device-id"]?.toString() || "unknown-device"
    );
    return res.status(200).json({ 
      message: "Verification required",
      requiresVerification: true 
    });
  }

  res.status(200).json({ message: "Login successful" });
});`}</pre>
                </div>
              </div>

              {/* Response Structure */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Response Object
                    </span>
                    <CopyButton
                      text={`{\n  "success": true,\n  "message": "Email sent successfully",\n  "verificationCode": "123456"\n}`}
                      field="triggerResponse"
                      label="Response"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "message": "Email sent successfully",
  "verificationCode": "123456"
}`}</pre>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  The response includes a 6-digit verification code that was sent to the user's email. You can use this for testing or display it to the user if needed.
                </p>
              </div>

              {/* Verification Function */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verify Code</h4>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  After sending the verification email, use the <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>verify()</code> function to validate the code entered by the user:
                </p>
                <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      verify()
                    </span>
                    <CopyButton
                      text={`const result = await unshared_labs_client.verify(\n  emailAddress,\n  deviceId,\n  code\n);\n\nif (result.pass) {\n  // Verification successful\n} else {\n  // Verification failed\n}`}
                      field="verifyExample"
                      label="Code"
                    />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`const result = await unshared_labs_client.verify(
  emailAddress,
  deviceId,
  code
);

if (result.pass) {
  // Verification successful
} else {
  // Verification failed
}`}</pre>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    <Book className="w-4 h-4 inline mr-2" />
                    <strong>Need more examples?</strong>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Check out the <strong>Documentation</strong> tab in the sidebar for complete code examples, API reference, and integration guides.
                  </p>
                </div>
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <Mail className="w-4 h-4" />
                  Still need help? Email{' '}
                  <a href="mailto:support@unsharedlabs.com" className="underline" style={{ color: 'var(--text-primary)' }}>
                    support@unsharedlabs.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </StepCard>
          )}

          {!state.nodejsSteps.verification && (
            <StepCard stepId="verification" stepNumber={6} title="Set up Account Verification (Optional)" description="Set up account verification to send verification emails from your own domain.">
              <div className="space-y-4">
              
              {/* Toggle to opt into verification */}
              <div className="flex items-center gap-3 p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={state.optIntoVerification ?? false}
                    onChange={(e) => {
                      const next: OnboardingState = { ...state, optIntoVerification: e.target.checked }
                      setState(next)
                      void persist(next)
                      // Check prevention status when opting in
                      if (e.target.checked) {
                        void checkPreventionComplete()
                      }
                    }}
                    className="w-5 h-5 rounded border-2 cursor-pointer"
                    style={{
                      accentColor: '#10b981',
                      borderColor: 'var(--border-strong)',
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    I want to set up account verification
                  </span>
                </label>
              </div>

              {/* Show prevention link and info if opted in */}
              {state.optIntoVerification && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/dashboard/company/prevention')
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10b981'
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Go to Prevention Settings</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> You must complete all prevention steps before you can mark this onboarding step as complete.
                    </p>
                  </div>
                </>
              )}

              {/* Show info if not opted in */}
              {!state.optIntoVerification && (
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> This step is optional. Check the box above to include it in your onboarding progress.
                  </p>
                </div>
              )}
            </div>
          </StepCard>
          )}
        </div>

        {/* Completed Tasks Section */}
        {(state.nodejsSteps.credentials || state.nodejsSteps.install || state.nodejsSteps.initialize || state.nodejsSteps.integrate || state.nodejsSteps.handle || (state.optIntoVerification && state.nodejsSteps.verification)) && (
          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
              Completed Tasks
            </h2>
            <div className="space-y-4">
              {state.nodejsSteps.credentials && (
                <StepCard stepId="credentials" stepNumber={1} title="Get Your API Credentials" description="Copy your Client ID and API Key">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Client ID
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowClientId(!showClientId)}
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
                            title={showClientId ? 'Hide Client ID' : 'Show Client ID'}
                          >
                            {showClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <CopyButton text={clientId} field="clientId" label="Client ID" />
                        </div>
                      </div>
                      <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        {showClientId ? clientId : '•'.repeat(clientId.length)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            API Key
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {apiKey && (
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
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
                              title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          {apiKey && <CopyButton text={apiKey} field="apiKey" label="API Key" />}
                        </div>
                      </div>
                      {apiKey ? (
                        <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                          {showApiKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 50))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            No API key generated yet. Click the button below to generate one.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateApiKey}
                            disabled={isGeneratingApiKey}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            style={{
                              backgroundColor: isGeneratingApiKey ? 'var(--hover-bg)' : '#10b981',
                              color: isGeneratingApiKey ? 'var(--text-tertiary)' : 'white',
                              cursor: isGeneratingApiKey ? 'not-allowed' : 'pointer',
                              opacity: isGeneratingApiKey ? 0.5 : 1,
                            }}
                          >
                            {isGeneratingApiKey ? (
                              <>
                                <Clock className="w-4 h-4 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4" />
                                <span>Generate API Key</span>
                              </>
                            )}
                          </button>
                          {apiKeyError && (
                            <p className="text-sm" style={{ color: '#ef4444' }}>
                              {apiKeyError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Security Note:</strong> Keep your API key secure and never commit it to version control. Store it in environment variables.
                      </p>
                    </div>
                  </div>
                </StepCard>
              )}

              {state.nodejsSteps.install && (
                <StepCard stepId="install" stepNumber={2} title="Install the SDK" description="Install the Unshared Labs Node.js SDK">
                  <div className="space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Install the SDK in your backend app.
                    </p>
                    <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <code style={{ color: 'var(--text-primary)' }}>npm install unshared-clientjs-sdk</code>
                        <CopyButton text="npm install unshared-clientjs-sdk" field="installCmd" label="Command" />
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {state.nodejsSteps.initialize && (
                <StepCard stepId="initialize" stepNumber={3} title="Initialize the SDK" description="Set up the SDK in your backend code">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg font-mono text-sm overflow-hidden" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Environment Variables
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowClientId(!showClientId)
                              setShowApiKey(!showApiKey)
                            }}
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
                            title={showClientId && showApiKey ? 'Hide credentials' : 'Show credentials'}
                          >
                            {(showClientId && showApiKey) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <CopyButton text={`UNSHARED_LABS_CLIENT_ID=${clientId}\nUNSHARED_LABS_API_KEY=${apiKey || 'your-api-key-here'}`} field="env" label=".env" />
                        </div>
                      </div>
                      <pre className="break-all" style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                        {`UNSHARED_LABS_CLIENT_ID=${showClientId ? clientId : '•'.repeat(clientId.length)}\nUNSHARED_LABS_API_KEY=${showApiKey ? (apiKey || 'your-api-key-here') : '•'.repeat(Math.min((apiKey || 'your-api-key-here').length, 50))}`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          TypeScript/JavaScript
                        </span>
                        <CopyButton
                          text={`const unshared_labs_client = new UnsharedLabsClient({\n  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,\n  apiKey: process.env.UNSHARED_LABS_API_KEY!\n});`}
                          field="init"
                          label="Code"
                        />
                      </div>
                      <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{`const unshared_labs_client = new UnsharedLabsClient({\n  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,\n  apiKey: process.env.UNSHARED_LABS_API_KEY!\n});`}</pre>
                    </div>
                  </div>
                </StepCard>
              )}

              {state.nodejsSteps.integrate && (
                <StepCard stepId="integrate" stepNumber={4} title="Integrate Event Tracking" description="Send key events like login/signup/content access to detect account sharing">
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                      <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Book className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Tip:</strong> For complete examples and API reference, check the <strong>Documentation</strong> tab in the sidebar.
                        </span>
                      </p>
                    </div>

                    {/* Function Signature */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            processUserEvent()
                          </span>
                          <CopyButton
                            text={`processUserEvent(\n  eventType: string,\n  userId: string,\n  ipAddress: string,\n  deviceId: string,\n  sessionHash: string,\n  userAgent: string,\n  emailAddress: string,\n  subscriptionStatus?: string | null,\n  eventDetails?: Map<string, any> | null\n): Promise<any>`}
                            field="eventSignature"
                            label="Signature"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`processUserEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  emailAddress: string,
  subscriptionStatus?: string | null,
  eventDetails?: Map<string, any> | null
): Promise<any>`}</pre>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventType</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">The type of event (e.g., 'login', 'signup', 'page_view', 'content_access')</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userId</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">Unique identifier for the user</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>ipAddress</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">User's IP address (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.ip</code> or <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-forwarded-for']</code>)</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">Unique device identifier (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-device-id']</code>)</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>sessionHash</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">Session identifier (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['x-session-hash']</code>)</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>userAgent</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">Browser user agent string (e.g., from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>req.headers['user-agent']</code>)</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>emailAddress</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">User's email address</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>subscriptionStatus</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string | null</code> (optional)</div>
                          <div className="text-xs mt-1">Subscription status: 'paid', 'free', 'free trial', 'discounted', or 'other'</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>eventDetails</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>Map&lt;string, any&gt; | null</code> (optional)</div>
                          <div className="text-xs mt-1">Additional event metadata (e.g., <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>new Map([['source', 'web']])</code>)</div>
                        </div>
                      </div>
                    </div>

                    {/* Example */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Example: Login Event</h4>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Express.js Route Handler
                          </span>
                          <CopyButton
                            text={`app.post("/login", async (req, res) => {\n  const { userId, emailAddress } = req.body;\n\n  const result = await unshared_labs_client.processUserEvent(\n    "login",\n    userId,\n    req.ip,\n    req.headers["x-device-id"]?.toString() || "unknown-device",\n    req.headers["x-session-hash"]?.toString() || "unknown-session",\n    req.headers["user-agent"] || "",\n    emailAddress,\n    "paid"\n  );\n\n  if (result.analysis.is_user_flagged) {\n    // Handle flagged user\n  }\n\n  res.status(200).json({ message: "Login successful" });\n});`}
                            field="eventExample"
                            label="Code"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`app.post("/login", async (req, res) => {
  const { userId, emailAddress } = req.body;

  const result = await unshared_labs_client.processUserEvent(
    "login",
    userId,
    req.ip,
    req.headers["x-device-id"]?.toString() || "unknown-device",
    req.headers["x-session-hash"]?.toString() || "unknown-session",
    req.headers["user-agent"] || "",
    emailAddress,
    "paid"
  );

  if (result.analysis.is_user_flagged) {
    // Handle flagged user
  }

  res.status(200).json({ message: "Login successful" });
});`}</pre>
                      </div>
                    </div>

                    {/* Response Structure */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Response Object
                          </span>
                          <CopyButton
                            text={`{\n  "success": true,\n  "event": {\n    "data": [...],\n    "status": "success"\n  },\n  "analysis": {\n    "status": "success",\n    "is_user_flagged": true\n  }\n}`}
                            field="eventResponse"
                            label="Response"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "event": {
    "data": [...],
    "status": "success"
  },
  "analysis": {
    "status": "success",
    "is_user_flagged": true
  }
}`}</pre>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Check <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>result.analysis.is_user_flagged</code> to determine if the user should be verified.
                      </p>
                    </div>
                  </div>
                </StepCard>
              )}

              {state.nodejsSteps.handle && (
                <StepCard stepId="handle" stepNumber={5} title="Handle Flagged Users" description="Trigger email verification when a user is flagged for potential account sharing">
                  <div className="space-y-4">
                    {/* Function Signature */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Function Signature</h4>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            triggerEmailVerification()
                          </span>
                          <CopyButton
                            text={`triggerEmailVerification(\n  emailAddress: string,\n  deviceId: string\n): Promise<any>`}
                            field="triggerSignature"
                            label="Signature"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`triggerEmailVerification(
  emailAddress: string,
  deviceId: string
): Promise<any>`}</pre>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Parameters</h4>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>emailAddress</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">The email address of the flagged user to send verification code to</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                          <div className="font-mono font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>deviceId</div>
                          <div className="text-xs">Type: <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>string</code></div>
                          <div className="text-xs mt-1">The device identifier associated with the flagged user</div>
                        </div>
                      </div>
                    </div>

                    {/* Complete Example */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Complete Example</h4>
                      <div className="p-4 rounded-lg font-mono text-sm overflow-hidden" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Express.js Route Handler
                          </span>
                          <CopyButton
                            text={`app.post("/login", async (req, res) => {\n  const { userId, emailAddress } = req.body;\n\n  const result = await unshared_labs_client.processUserEvent(\n    "login",\n    userId,\n    req.ip,\n    req.headers["x-device-id"]?.toString() || "unknown-device",\n    req.headers["x-session-hash"]?.toString() || "unknown-session",\n    req.headers["user-agent"] || "",\n    emailAddress,\n    "paid"\n  );\n\n  if (result.analysis.is_user_flagged) {\n    // Trigger email verification\n    await unshared_labs_client.triggerEmailVerification(\n      emailAddress,\n      req.headers["x-device-id"]?.toString() || "unknown-device"\n    );\n    return res.status(200).json({ \n      message: "Verification required",\n      requiresVerification: true \n    });\n  }\n\n  res.status(200).json({ message: "Login successful" });\n});`}
                            field="flaggedExample"
                            label="Code"
                          />
                        </div>
                        <pre className="break-all overflow-x-auto" style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '100%', fontSize: '0.75rem' }}>{`app.post("/login", async (req, res) => {
  const { userId, emailAddress } = req.body;

  const result = await unshared_labs_client.processUserEvent(
    "login",
    userId,
    req.ip,
    req.headers["x-device-id"]?.toString() || "unknown-device",
    req.headers["x-session-hash"]?.toString() || "unknown-session",
    req.headers["user-agent"] || "",
    emailAddress,
    "paid"
  );

  if (result.analysis.is_user_flagged) {
    // Trigger email verification
    await unshared_labs_client.triggerEmailVerification(
      emailAddress,
      req.headers["x-device-id"]?.toString() || "unknown-device"
    );
    return res.status(200).json({ 
      message: "Verification required",
      requiresVerification: true 
    });
  }

  res.status(200).json({ message: "Login successful" });
});`}</pre>
                      </div>
                    </div>

                    {/* Response Structure */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Response Structure</h4>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Response Object
                          </span>
                          <CopyButton
                            text={`{\n  "success": true,\n  "message": "Email sent successfully",\n  "verificationCode": "123456"\n}`}
                            field="triggerResponse"
                            label="Response"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`{
  "success": true,
  "message": "Email sent successfully",
  "verificationCode": "123456"
}`}</pre>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        The response includes a 6-digit verification code that was sent to the user's email. You can use this for testing or display it to the user if needed.
                      </p>
                    </div>

                    {/* Verification Function */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verify Code</h4>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        After sending the verification email, use the <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>verify()</code> function to validate the code entered by the user:
                      </p>
                      <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            verify()
                          </span>
                          <CopyButton
                            text={`const result = await unshared_labs_client.verify(\n  emailAddress,\n  deviceId,\n  code\n);\n\nif (result.pass) {\n  // Verification successful\n} else {\n  // Verification failed\n}`}
                            field="verifyExample"
                            label="Code"
                          />
                        </div>
                        <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{`const result = await unshared_labs_client.verify(
  emailAddress,
  deviceId,
  code
);

if (result.pass) {
  // Verification successful
} else {
  // Verification failed
}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6' }}>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                          <Book className="w-4 h-4 inline mr-2" />
                          <strong>Need more examples?</strong>
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Check out the <strong>Documentation</strong> tab in the sidebar for complete code examples, API reference, and integration guides.
                        </p>
                      </div>
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                        <Mail className="w-4 h-4" />
                        Still need help? Email{' '}
                        <a href="mailto:support@unsharedlabs.com" className="underline" style={{ color: 'var(--text-primary)' }}>
                          support@unsharedlabs.com
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </StepCard>
              )}

              {state.optIntoVerification && state.nodejsSteps.verification && (
                <StepCard stepId="verification" stepNumber={6} title="Set up Account Verification (Optional)" description="Set up account verification to send verification emails from your own domain.">
                  <div className="space-y-4">
                    {/* Toggle to opt into verification */}
                    <div className="flex items-center gap-3 p-4 rounded-lg border-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-strong)' }}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={state.optIntoVerification ?? false}
                          onChange={(e) => {
                            const next: OnboardingState = { ...state, optIntoVerification: e.target.checked }
                            setState(next)
                            void persist(next)
                            // Check prevention status when opting in
                            if (e.target.checked) {
                              void checkPreventionComplete()
                            }
                          }}
                          className="w-5 h-5 rounded border-2 cursor-pointer"
                          style={{
                            accentColor: '#10b981',
                            borderColor: 'var(--border-strong)',
                          }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          I want to set up account verification
                        </span>
                      </label>
                    </div>

                    {/* Show prevention link and info if opted in */}
                    {state.optIntoVerification && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/dashboard/company/prevention')
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981'
                          }}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Go to Prevention Settings</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> You must complete all prevention steps before you can mark this onboarding step as complete.
                          </p>
                        </div>
                      </>
                    )}

                    {/* Show info if not opted in */}
                    {!state.optIntoVerification && (
                      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> This step is optional. Check the box above to include it in your onboarding progress.
                        </p>
                      </div>
                    )}
                  </div>
                </StepCard>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    )
  }

  // Default fallback (should not reach here)
  return null
}

