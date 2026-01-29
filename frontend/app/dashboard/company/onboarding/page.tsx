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
  Globe,
  Key,
  Mail,
  Rocket,
  Server,
  Shield,
  Smartphone,
  X,
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

type NodeStepId = 'credentials' | 'install' | 'initialize' | 'integrate' | 'handle'
type NextjsStepId = 'install' | 'integrate'

type OnboardingState = {
  selectedTechStacks: string[]
  nodejsSteps: Record<NodeStepId, boolean>
  nextjsSteps: Record<NextjsStepId, boolean>
  completedTechStacks?: string[] // Track which tech stacks were completed when onboarding was marked complete
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
  },
  nextjsSteps: {
    install: false,
    integrate: false,
  },
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

  // Placeholder credentials - in production, these should come from the API
  const clientId = user?.companyId || 'your-client-id'
  const apiKey = 'your-api-key-here'

  const selectedTechStacks = state.selectedTechStacks
  const selectedTechObjects = useMemo(
    () => selectedTechStacks.map((id) => techStacks.find((t) => t.id === id)).filter(Boolean) as TechStack[],
    [selectedTechStacks, techStacks]
  )
  const selectedUnsupported = useMemo(() => selectedTechObjects.filter((t) => !t.available), [selectedTechObjects])
  const nodeSelected = selectedTechStacks.includes('nodejs')
  const nextjsSelected = selectedTechStacks.includes('nextjs')
  const nodeStepsCompletedCount = (Object.values(state.nodejsSteps) as boolean[]).filter(Boolean).length
  const nodeStepsTotal = Object.keys(state.nodejsSteps).length
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

  // Scroll to first incomplete step when nodejs or nextjs screen loads
  useEffect(() => {
    if ((screen !== 'nodejs' && screen !== 'nextjs') || isLoadingOnboarding) return

    let firstIncomplete: string | undefined
    if (screen === 'nodejs') {
      const stepOrder: NodeStepId[] = ['credentials', 'install', 'initialize', 'integrate', 'handle']
      firstIncomplete = stepOrder.find((stepId) => !state.nodejsSteps[stepId])
    } else if (screen === 'nextjs') {
      const stepOrder: NextjsStepId[] = ['install', 'integrate']
      firstIncomplete = stepOrder.find((stepId) => !state.nextjsSteps[stepId])
    }

    if (firstIncomplete) {
      // Delay to ensure DOM is ready after state loads
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(`step-${firstIncomplete}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Add a slight offset from the top for better visibility
          setTimeout(() => {
            window.scrollBy({ top: -20, behavior: 'smooth' })
          }, 300)
        }
      }, 200)
      return () => clearTimeout(timeoutId)
    }
  }, [screen, isLoadingOnboarding, state.nodejsSteps, state.nextjsSteps])

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

  const toggleNodeStep = (stepId: NodeStepId) => {
    // Only allow marking as complete, not uncompleting
    if (state.nodejsSteps[stepId]) return
    
    // Enforce sequential completion
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
      
      if (stackType === 'nodejs') {
        const stepOrder: NodeStepId[] = ['credentials', 'install', 'initialize', 'integrate', 'handle']
        const currentIndex = stepOrder.indexOf(stepId as NodeStepId)
        if (currentIndex === 0) return true // First step
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
    
    const handleToggle = () => {
      if (!canComplete) return
      if (stackType === 'nodejs') {
        toggleNodeStep(stepId as NodeStepId)
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
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={!canComplete}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: canComplete ? '#10b981' : 'var(--hover-bg)',
                      color: canComplete ? 'white' : 'var(--text-tertiary)',
                      cursor: canComplete ? 'pointer' : 'not-allowed',
                      opacity: canComplete ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (canComplete) {
                        e.currentTarget.style.backgroundColor = '#059669'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canComplete) {
                        e.currentTarget.style.backgroundColor = '#10b981'
                      }
                    }}
                    title={!canComplete ? 'Complete previous steps first' : ''}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Complete</span>
                  </button>
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

          <div className="space-y-4">
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

            <StepCard stepId="integrate" stepNumber={2} title="Integrate Event Tracking" description="Add event tracking to your Next.js API routes" stackType="nextjs">
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Add event tracking in your Next.js API routes (e.g., <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>/app/api/auth/login/route.ts</code>).
                </p>
                <div className="p-4 rounded-lg font-mono text-sm relative" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Example: Next.js API Route</span>
                    <CopyButton text={`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  return Response.json({ success: true })
}`} field="nextjsIntegrate" label="Code" />
                  </div>
                  <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
{`import UnsharedLabsClient from 'unshared-clientjs-sdk'

const client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
})

export async function POST(req: Request) {
  const { userId, email } = await req.json()
  
  await client.processUserEvent(
    'login',
    userId,
    req.headers.get('x-forwarded-for') || '',
    req.headers.get('x-device-id') || '',
    req.headers.get('x-session-hash') || '',
    req.headers.get('user-agent') || '',
    email,
    'paid'
  )
  
  return Response.json({ success: true })
}`}
                  </pre>
                </div>
              </div>
            </StepCard>
          </div>

          {/* Next Stack Button or Go to Dashboard - Show when multiple stacks are selected or all complete */}
          {(selectedTechStacks.length > 1 || allOnboardingComplete) && (
            <div className="mt-8 flex justify-center">
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
                className="px-6 py-3 rounded-lg transition-all flex items-center gap-2"
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
                  Node.js Integration Guide
                </p>
              </div>
            </div>
              <div className="flex items-center gap-2">
                {nodeSelected && screen === 'nodejs' && (
                  <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Node.js Guide
                  </span>
                )}
                {nextjsSelected && screen === 'nodejs' && (
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('nextjs')
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
                    Next.js Guide
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

        <div className="space-y-4">
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
                  <CopyButton text={clientId} field="clientId" label="Client ID" />
                </div>
                <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                  {clientId}
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
                  <CopyButton text={apiKey} field="apiKey" label="API Key" />
                </div>
                <div className="p-3 rounded font-mono text-sm break-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                  {apiKey}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Security Note:</strong> Keep your API key secure and never commit it to version control. Store it in environment variables.
                </p>
              </div>
            </div>
          </StepCard>

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

          <StepCard stepId="initialize" stepNumber={3} title="Initialize the SDK" description="Set up the SDK in your backend code">
            <div className="space-y-4">
              <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Environment Variables
                  </span>
                  <CopyButton text={`UNSHARED_LABS_CLIENT_ID=${clientId}\nUNSHARED_LABS_API_KEY=${apiKey}`} field="env" label=".env" />
                </div>
                <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{`UNSHARED_LABS_CLIENT_ID=${clientId}\nUNSHARED_LABS_API_KEY=${apiKey}`}</pre>
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

          <StepCard stepId="integrate" stepNumber={4} title="Integrate Event Tracking" description="Send key events like login/signup/content access">
            <div className="space-y-4">
              <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Example: Login Event
                  </span>
                  <CopyButton
                    text={`await unshared_labs_client.processUserEvent(\n  'login',\n  userId,\n  ipAddress,\n  deviceId,\n  sessionHash,\n  userAgent,\n  emailAddress,\n  'paid'\n);`}
                    field="event"
                    label="Code"
                  />
                </div>
                <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{`await unshared_labs_client.processUserEvent(\n  'login',\n  userId,\n  ipAddress,\n  deviceId,\n  sessionHash,\n  userAgent,\n  emailAddress,\n  'paid'\n);`}</pre>
              </div>
            </div>
          </StepCard>

          <StepCard stepId="handle" stepNumber={5} title="Handle Flagged Users" description="Trigger verification when a user is flagged">
            <div className="space-y-4">
              <div className="p-4 rounded-lg font-mono text-sm" style={{ backgroundColor: 'var(--code-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Example
                  </span>
                  <CopyButton
                    text={`if (result.analysis.is_user_flagged) {\n  await unshared_labs_client.triggerEmailVerification(\n    emailAddress,\n    deviceId\n  );\n}`}
                    field="flagged"
                    label="Code"
                  />
                </div>
                <pre style={{ color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{`if (result.analysis.is_user_flagged) {\n  await unshared_labs_client.triggerEmailVerification(\n    emailAddress,\n    deviceId\n  );\n}`}</pre>
              </div>

              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                <Mail className="w-4 h-4" />
                Need help? Email{' '}
                <a href="mailto:support@unsharedlabs.com" className="underline" style={{ color: 'var(--text-primary)' }}>
                  support@unsharedlabs.com
                </a>
                .
              </p>
            </div>
          </StepCard>
        </div>

        {/* Next Stack Button or Go to Dashboard - Show when multiple stacks are selected or all complete */}
        {(selectedTechStacks.length > 1 || allOnboardingComplete) && (
          <div className="mt-8 flex justify-center">
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
              className="px-6 py-3 rounded-lg transition-all flex items-center gap-2"
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
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

