'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Building2, Users, AlertTriangle, DollarSign, MapPin, BarChart3, TrendingUp, Activity, Search, ChevronDown, ChevronUp, Map, List, ZoomIn, ZoomOut, RotateCcw, X, Rocket } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getSessionToken } from '@/lib/auth'

interface CompanyData {
  summary: {
    users_flagged: number
    flagged_percentage: number
    total_users_analyzed: number
    total_devices_tracked: number
    total_potential_borrowers: number
    estimated_monthly_revenue_at_risk: number
  }
  metrics_trend: {
    data: Array<{
      date: string
      conversions: number
      active_borrowers: number
      true_conversions: number
      accounts_with_borrowers: number
    }>
  }
  geographic_data: {
    all_locations: Array<{
      lat: number
      lon: number
      city: string
      total_users: number
      flagged_users: number
    }>
  }
  sharing_activity: {
    data: Array<{
      name: string
      sharing: number
    }>
  }
  detection_breakdown: {
    data: Array<{
      color: string
      count: number
      signal: string
    }>
  }
  top_flagged_accounts: {
    data: Array<{
      score: number
      risk_level: string
      user_email: string
      evidence_summary: string
      potential_borrowers: number
    }>
  }
}

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [onboardingProgress, setOnboardingProgress] = useState({ completed: 0, total: 5 })
  const [onboardingState, setOnboardingState] = useState<any>(null)
  const [hasNewIncompleteTechStack, setHasNewIncompleteTechStack] = useState(false)
  const [newTechStacks, setNewTechStacks] = useState<string[]>([])
  const [dismissedDashboardNotification, setDismissedDashboardNotification] = useState(false)
  const [hasPreviouslyCompletedStacks, setHasPreviouslyCompletedStacks] = useState(false)
  const [hasIncompleteOnboarding, setHasIncompleteOnboarding] = useState(false)
  const [flaggedAccountsSearch, setFlaggedAccountsSearch] = useState('')
  const [geographicSearch, setGeographicSearch] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [geographicView, setGeographicView] = useState<'map' | 'table'>('map')
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedMarker, setSelectedMarker] = useState<{
    name: string
    flaggedUsers: number
    totalUsers: number
    coordinates: [number, number]
  } | null>(null)

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const collapseAll = () => {
    setCollapsedSections({
      activeBorrowers: true,
      conversions: true,
      detectionBreakdown: true,
      sharingActivity: true,
      geographic: true,
      flaggedAccounts: true
    })
  }

  const expandAll = () => {
    setCollapsedSections({
      activeBorrowers: false,
      conversions: false,
      detectionBreakdown: false,
      sharingActivity: false,
      geographic: false,
      flaggedAccounts: false
    })
  }

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/signin')
      return
    }

    if (user.role === 'super_admin') {
      router.push('/admin')
      return
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (isLoading) return

    // No company yet -> gate dashboard and stop loading
    if (!user?.companyId) {
      setOnboardingCompleted(false)
      setDataLoading(false)
      setCompanyData(null)
      setDataError(null)
      return
    }

    const fetchOnboardingAndMaybeData = async () => {
      try {
        setDataLoading(true)
        setDataError(null)
        setCompanyData(null)

        const sessionToken = getSessionToken()
        if (!sessionToken) {
          setOnboardingCompleted(false)
          setOnboardingProgress({ completed: 0, total: 5 })
          setDataError('Not authenticated')
          return
        }

        // 1) Fetch onboarding state
        const onboardingRes = await fetch(`/api/companies/${user.companyId}/onboarding`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        const onboardingJson = await onboardingRes.json()

        const state = onboardingJson?.state || {}
        setOnboardingState(state)

        // Node.js onboarding has 5 fixed steps: credentials, install, initialize, integrate, handle
        const nodeSteps: Record<string, boolean> = state.nodejsSteps || {}
        const completedCount = Object.values(nodeSteps).filter(Boolean).length
        const totalCount = 5 // Fixed number of Node.js onboarding steps
        setOnboardingProgress({ completed: completedCount, total: totalCount })
        setOnboardingCompleted(Boolean(onboardingJson?.completed))

        // Check if there are incomplete tech stacks
        const completedTechStacks = state.completedTechStacks || []
        const selectedTechStacks = state.selectedTechStacks || []
        const incompleteTechStacksList = selectedTechStacks.filter((stack: string) => !completedTechStacks.includes(stack))
        const hasNew = incompleteTechStacksList.length > 0 && completedTechStacks.length > 0
        const hasIncompleteStacks = incompleteTechStacksList.length > 0
        
        const hasPreviouslyCompleted = completedTechStacks.length > 0
        
        setHasNewIncompleteTechStack(hasNew)
        setNewTechStacks(incompleteTechStacksList)
        setHasPreviouslyCompletedStacks(hasPreviouslyCompleted)
        
        // Track if there are any incomplete stacks (for button visibility)
        setHasIncompleteOnboarding(hasIncompleteStacks || !onboardingJson?.completed)

        // 2) If onboarding incomplete AND no previously completed stacks -> don't fetch data
        // If there are previously completed stacks, allow viewing data even with new incomplete stacks
        if (!onboardingJson?.completed && !hasPreviouslyCompleted) {
          return
        }

        // 3) Fetch company data (now allowed)
        const dataRes = await fetch(`/api/companies/${user.companyId}/data`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        })
        const result = await dataRes.json()

        if (result.success && result.data) {
          setCompanyData(result.data)
        } else if (result.success && !result.data) {
          // No data available yet (new client)
          setCompanyData(null)
        } else {
          setDataError(result.error || 'Failed to load data')
        }
      } catch (error) {
        console.error('Error fetching onboarding/dashboard data:', error)
        setDataError('Failed to load dashboard')
      } finally {
        setDataLoading(false)
      }
    }

    fetchOnboardingAndMaybeData()
  }, [user?.companyId, isLoading])

  // Skeleton loader component
  const SkeletonLoader = () => (
    <>
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border-2 animate-pulse"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div 
              className="w-10 h-10 rounded-lg mb-3"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
            <div 
              className="h-8 w-24 rounded mb-2"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
            <div 
              className="h-4 w-32 rounded"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
          </div>
        ))}
      </div>

      {/* Chart Cards Skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-6 rounded-lg border-2 mb-8 animate-pulse"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)'
          }}
        >
          <div 
            className="h-6 w-48 rounded mb-4"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
          <div 
            className="h-80 w-full rounded"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
        </div>
      ))}
    </>
  )

  if (isLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Dashboard
                </h2>
                <p style={{ color: 'var(--text-tertiary)' }}>
                  {user?.companyName ? `Analytics for ${user.companyName}` : 'Company Analytics'}
                </p>
              </div>
            </div>
          </div>
          <SkeletonLoader />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  if (user.role === 'super_admin') {
    return (
      <DashboardLayout>
        <div 
          className="h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </DashboardLayout>
    )
  }

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  // Helper function to format currency
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Simple bar chart component with improved spacing and axes
  const SimpleBarChart = ({ data, height = 300, color = '#3b82f6' }: { data: Array<{ name: string; value: number }>, height?: number, color?: string }) => {
    if (!data || data.length === 0) return null

    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

    const svgWidth = 800
    const svgHeight = height
    const padding = { top: 30, right: 40, bottom: 60, left: 70 }
    const chartWidth = svgWidth - padding.left - padding.right
    const chartHeight = svgHeight - padding.top - padding.bottom

    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = 0
    
    // Round max for cleaner Y-axis
    const roundedMax = Math.ceil(maxValue / 5) * 5 || 5
    const roundedRange = roundedMax - minValue
    
    // Calculate Y-axis ticks (5 ticks)
    const yTicks = 5
    const yTickValues: number[] = []
    for (let i = 0; i <= yTicks; i++) {
      yTickValues.push(minValue + (roundedRange * i / yTicks))
    }

    // Show only some dates on X-axis (every nth date based on data length)
    const showEveryNth = Math.max(1, Math.floor(data.length / 8)) // Show ~8 labels max
    const visibleDateIndices = new Set<number>()
    for (let i = 0; i < data.length; i++) {
      if (i % showEveryNth === 0 || i === data.length - 1) {
        visibleDateIndices.add(i)
      }
    }

    const barWidth = chartWidth / data.length
    const barSpacing = barWidth * 0.15
    const actualBarWidth = barWidth - barSpacing

    return (
      <div className="w-full relative" style={{ height: `${height}px` }}>
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px',
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.content}
          </div>
        )}
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Y-axis labels and grid lines */}
          {yTickValues.map((tickValue, index) => {
            const y = padding.top + chartHeight - (((tickValue - minValue) / roundedRange) * chartHeight)
            return (
              <g key={index}>
                {/* Grid line */}
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.2"
                />
                {/* Y-axis label */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="var(--text-tertiary)"
                >
                  {Math.round(tickValue).toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="var(--border-color)"
            strokeWidth="2"
          />
          
          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="var(--border-color)"
            strokeWidth="2"
          />

          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = roundedRange > 0 ? (item.value / roundedRange) * chartHeight : 0
            const x = padding.left + (index * barWidth) + (barSpacing / 2)
            const y = padding.top + chartHeight - barHeight

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={actualBarWidth}
                  height={barHeight}
                  fill={color}
                  rx={4}
                  style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const svg = e.currentTarget.ownerSVGElement
                    if (svg) {
                      const rect = svg.getBoundingClientRect()
                      const svgPoint = svg.createSVGPoint()
                      svgPoint.x = x + actualBarWidth / 2
                      svgPoint.y = y
                      const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                      setTooltip({
                        x: screenPoint.x - rect.left,
                        y: screenPoint.y - rect.top,
                        content: `${item.name}: ${item.value.toLocaleString()}`
                      })
                    }
                    e.currentTarget.style.opacity = '0.8'
                  }}
                  onMouseLeave={(e) => {
                    setTooltip(null)
                    e.currentTarget.style.opacity = '1'
                  }}
                />
                {/* X-axis labels (only visible dates) */}
                {visibleDateIndices.has(index) && (
                  <text
                    x={x + actualBarWidth / 2}
                    y={padding.top + chartHeight + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--text-tertiary)"
                  >
                    {item.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // Line chart component with improved spacing and axes
  const SimpleLineChart = ({ data, height = 300, color = '#3b82f6' }: { data: Array<{ name: string; value: number }>, height?: number, color?: string }) => {
    if (!data || data.length === 0) return null

    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

    const svgWidth = 800
    const svgHeight = height
    const padding = { top: 30, right: 40, bottom: 60, left: 70 }
    const chartWidth = svgWidth - padding.left - padding.right
    const chartHeight = svgHeight - padding.top - padding.bottom
    
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    
    // Round max/min for cleaner Y-axis
    const roundedMax = Math.ceil(maxValue / 50) * 50
    const roundedMin = Math.max(0, Math.floor(minValue / 50) * 50)
    const roundedRange = roundedMax - roundedMin || 1
    
    // Calculate Y-axis ticks (5 ticks)
    const yTicks = 5
    const yTickValues: number[] = []
    for (let i = 0; i <= yTicks; i++) {
      yTickValues.push(roundedMin + (roundedRange * i / yTicks))
    }

    // Show only some dates on X-axis (every nth date based on data length)
    const showEveryNth = Math.max(1, Math.floor(data.length / 8)) // Show ~8 labels max
    const visibleDateIndices = new Set<number>()
    for (let i = 0; i < data.length; i++) {
      if (i % showEveryNth === 0 || i === data.length - 1) {
        visibleDateIndices.add(i)
      }
    }

    // Calculate points
    const points = data.map((item, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth
      const y = padding.top + chartHeight - (((item.value - roundedMin) / roundedRange) * chartHeight)
      return { x, y, value: item.value, name: item.name, index }
    })

    // Create path strings for line and area
    const linePath = points.map((p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    }).join(' ')

    const areaPath = `${linePath} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

    return (
      <div className="w-full relative" style={{ height: `${height}px` }}>
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px',
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.content}
          </div>
        )}
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis labels and grid lines */}
          {yTickValues.map((tickValue, index) => {
            const y = padding.top + chartHeight - (((tickValue - roundedMin) / roundedRange) * chartHeight)
            return (
              <g key={index}>
                {/* Grid line */}
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.2"
                />
                {/* Y-axis label */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="var(--text-tertiary)"
                >
                  {Math.round(tickValue).toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="var(--border-color)"
            strokeWidth="2"
          />
          
          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="var(--border-color)"
            strokeWidth="2"
          />

          {/* Gradient fill area */}
          <path
            d={areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
          />
          
          {/* Line chart */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={color}
              stroke="var(--bg-primary)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.ownerSVGElement
                if (svg) {
                  const rect = svg.getBoundingClientRect()
                  const svgPoint = svg.createSVGPoint()
                  svgPoint.x = point.x
                  svgPoint.y = point.y
                  const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                  setTooltip({
                    x: screenPoint.x - rect.left,
                    y: screenPoint.y - rect.top,
                    content: `${point.name}: ${point.value.toLocaleString()}`
                  })
                }
                e.currentTarget.setAttribute('r', '7')
              }}
              onMouseLeave={(e) => {
                setTooltip(null)
                e.currentTarget.setAttribute('r', '5')
              }}
            />
          ))}

          {/* X-axis labels (only visible dates) */}
          {points.filter(p => visibleDateIndices.has(p.index)).map((point) => (
            <text
              key={point.index}
              x={point.x}
              y={padding.top + chartHeight + 25}
              textAnchor="middle"
              fontSize="12"
              fill="var(--text-tertiary)"
            >
              {point.name}
            </text>
          ))}
        </svg>
      </div>
    )
  }

  // Pie chart component with improved spacing and responsive styling
  const SimplePieChart = ({ data, size = 280 }: { data: Array<{ label: string; value: number; color: string }>, size?: number }) => {
    if (!data || data.length === 0) return null

    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    // Responsive sizes: smaller on mobile/tablet, larger on desktop
    const responsiveSize = {
      base: 220,   // Mobile
      md: 240,     // Tablet
      lg: 280      // Desktop
    }

    let currentAngle = -90

    return (
      <div className="flex flex-col xl:flex-row items-center justify-center gap-6 w-full relative">
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border-2 shadow-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px',
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.content}
          </div>
        )}
        {/* Pie Chart - responsive sizing */}
        <div className="flex-shrink-0 relative">
          <svg 
            className="w-[220px] md:w-[240px] xl:w-[280px] h-[220px] md:h-[240px] xl:h-[280px]"
            viewBox="0 0 280 280"
            preserveAspectRatio="xMidYMid meet"
          >
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle

              const center = 140
              const radius = 110
              const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180)
              const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180)

              const largeArcFlag = angle > 180 ? 1 : 0

              const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              // Calculate label position (middle of arc)
              const labelAngle = (startAngle + endAngle) / 2
              const labelRadius = radius * 0.7
              const labelX = center + labelRadius * Math.cos((labelAngle * Math.PI) / 180)
              const labelY = center + labelRadius * Math.sin((labelAngle * Math.PI) / 180)

              currentAngle += angle

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={item.color}
                    stroke="var(--bg-primary)"
                    strokeWidth="3"
                    style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const svg = e.currentTarget.ownerSVGElement
                      if (svg) {
                        const rect = svg.getBoundingClientRect()
                        const svgPoint = svg.createSVGPoint()
                        svgPoint.x = labelX
                        svgPoint.y = labelY
                        const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM())
                        const percentage = ((item.value / total) * 100).toFixed(1)
                        setTooltip({
                          x: screenPoint.x - rect.left,
                          y: screenPoint.y - rect.top,
                          content: `${item.label}: ${item.value.toLocaleString()} (${percentage}%)`
                        })
                      }
                      e.currentTarget.style.opacity = '0.8'
                    }}
                    onMouseLeave={(e) => {
                      setTooltip(null)
                      e.currentTarget.style.opacity = '1'
                    }}
                  />
                  {/* Show percentage label if slice is large enough */}
                  {percentage > 5 && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="white"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
        
        {/* Legend - responsive width */}
        <div className="space-y-3 w-full xl:w-auto xl:min-w-[200px]">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="h-1.5 rounded-full flex-1"
                      style={{ 
                        backgroundColor: 'var(--border-color)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Dashboard
              </h2>
              <p style={{ color: 'var(--text-tertiary)' }}>
                {user.companyName ? `Analytics for ${user.companyName}` : 'Company Analytics'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasIncompleteOnboarding && (
                <button
                  onClick={() => router.push('/dashboard/company/onboarding')}
                  className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)'
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
                  <Rocket className="w-4 h-4" />
                  Continue Onboarding
                </button>
              )}
              {companyData && (
                <>
                  <button
                    onClick={expandAll}
                    className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                      e.currentTarget.style.borderColor = 'var(--border-strong)'
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                      e.currentTarget.style.borderColor = 'var(--border-strong)'
                    }}
                  >
                    Collapse All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {!user?.companyId ? (
          <div
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-primary)' }} />
              <div className="flex-1">
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Create your company to unlock the dashboard
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  You need a company workspace before we can show analytics.
                </p>
                <button
                  onClick={() => router.push('/dashboard/company')}
                  className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                  }}
                >
                  Go to Company
                </button>
              </div>
            </div>
          </div>
        ) : !onboardingCompleted && !hasPreviouslyCompletedStacks ? (
          <div
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-primary)' }} />
              <div className="flex-1">
                <p className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  Complete onboarding to view your dashboard
                </p>
                <button
                  onClick={() => router.push('/dashboard/company/onboarding')}
                  className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                  }}
                >
                  Go to Onboarding
                </button>
              </div>
            </div>
          </div>
        ) : dataError ? (
          <div 
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <p style={{ color: 'var(--text-tertiary)' }}>{dataError}</p>
          </div>
        ) : !companyData ? (
          <div 
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <p className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
              No data yet. Your dashboard will populate once your external system sends updates.
            </p>
            <SkeletonLoader />
          </div>
        ) : (
          <>
            {/* Banner for new incomplete tech stack - Show at top when data exists */}
            {hasNewIncompleteTechStack && !dismissedDashboardNotification && companyData && (
              <div
                className="mb-6 p-4 rounded-lg border-2 flex items-start gap-3 relative"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#f59e0b' }}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    New Tech Stack Added
                  </p>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    You've added {newTechStacks.map(stack => {
                      const stackNames: Record<string, string> = {
                        'nodejs': 'Node.js',
                        'nextjs': 'Next.js',
                        'wordpress': 'WordPress',
                        'shopify': 'Shopify',
                        'webflow': 'Webflow',
                        'squarespace': 'Squarespace'
                      }
                      return stackNames[stack] || stack
                    }).join(', ')} to your tech stack. Complete onboarding for this {newTechStacks.length === 1 ? 'stack' : 'stack'} to continue.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/company/onboarding')}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: '#f59e0b', 
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#d97706'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f59e0b'
                    }}
                  >
                    Complete Onboarding
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedDashboardNotification(true)}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div 
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  >
                    <Users className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(companyData.summary.total_users_analyzed)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Users Analyzed</p>
              </div>

              <div 
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  >
                    <Activity className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(companyData.summary.total_devices_tracked)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Devices Tracked</p>
              </div>

              <div 
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  >
                    <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(companyData.summary.users_flagged)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Users Flagged ({companyData.summary.flagged_percentage}%)
                </p>
              </div>

              <div 
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  >
                    <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(companyData.summary.total_potential_borrowers)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Borrowers Detected</p>
              </div>

              <div 
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--hover-bg)' }}
                  >
                    <DollarSign className="w-5 h-5" style={{ color: '#ef4444' }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(companyData.summary.estimated_monthly_revenue_at_risk)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Monthly Revenue at Risk</p>
              </div>

            </div>

            {/* Conversions Chart - Full Width */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Conversions by Day
                </h3>
                <button
                  onClick={() => toggleSection('conversions')}
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
                  {collapsedSections.conversions ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!collapsedSections.conversions && (
                companyData.metrics_trend.data.length > 0 ? (
                  <SimpleBarChart
                    data={companyData.metrics_trend.data.map(item => ({
                      name: item.date,
                      value: item.conversions
                    }))}
                    height={320}
                    color="#10b981"
                />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No data available</p>
                )
              )}
            </div>

            {/* Active Borrowers Chart - Full Width */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Active Borrowers Per Day
                </h3>
                <button
                  onClick={() => toggleSection('activeBorrowers')}
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
                  {collapsedSections.activeBorrowers ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!collapsedSections.activeBorrowers && (
                companyData.metrics_trend.data.length > 0 ? (
                  <SimpleLineChart
                    data={companyData.metrics_trend.data.map(item => ({
                      name: item.date,
                      value: item.active_borrowers
                    }))}
                    height={320}
                    color="#3b82f6"
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No data available</p>
                )
              )}
            </div>

            {/* Detection Breakdown - Full Width */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Detection Methods Breakdown
                </h3>
                <button
                  onClick={() => toggleSection('detectionBreakdown')}
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
                  {collapsedSections.detectionBreakdown ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!collapsedSections.detectionBreakdown && (
                companyData.detection_breakdown.data.length > 0 ? (
                  <SimplePieChart
                    data={companyData.detection_breakdown.data.map(item => ({
                      label: item.signal,
                      value: item.count,
                      color: item.color
                    }))}
                    size={300}
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No data available</p>
                )
              )}
            </div>

            {/* Sharing Activity - Full Width */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sharing Activity
                </h3>
                <button
                  onClick={() => toggleSection('sharingActivity')}
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
                  {collapsedSections.sharingActivity ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!collapsedSections.sharingActivity && (
                companyData.sharing_activity.data.length > 0 ? (
                  <SimpleBarChart
                    data={companyData.sharing_activity.data.map(item => ({
                      name: item.name,
                      value: item.sharing
                    }))}
                    height={320}
                    color="#8b5cf6"
                  />
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No data available</p>
                )
              )}
            </div>

            {/* Geographic Distribution */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Geographic Distribution
                </h3>
                <div className="flex items-center gap-2">
                  {!collapsedSections.geographic && (
                    <div className="flex items-center gap-1 p-1 rounded-lg border-2" style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--card-bg)' }}>
                      <button
                        onClick={() => setGeographicView('map')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                          geographicView === 'map' ? '' : 'opacity-60'
                        }`}
                        style={{
                          backgroundColor: geographicView === 'map' ? 'var(--hover-bg)' : 'transparent',
                          color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => {
                          if (geographicView !== 'map') {
                            e.currentTarget.style.opacity = '1'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (geographicView !== 'map') {
                            e.currentTarget.style.opacity = '0.6'
                          }
                        }}
                      >
                        <Map className="w-4 h-4" />
                        Map
                      </button>
                      <button
                        onClick={() => setGeographicView('table')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                          geographicView === 'table' ? '' : 'opacity-60'
                        }`}
                        style={{
                          backgroundColor: geographicView === 'table' ? 'var(--hover-bg)' : 'transparent',
                          color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => {
                          if (geographicView !== 'table') {
                            e.currentTarget.style.opacity = '1'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (geographicView !== 'table') {
                            e.currentTarget.style.opacity = '0.6'
                          }
                        }}
                      >
                        <List className="w-4 h-4" />
                        Table
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => toggleSection('geographic')}
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
                    {collapsedSections.geographic ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {!collapsedSections.geographic && (
                <>
                  {geographicView === 'table' ? (
                    <>
                      {/* Search Input */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <input
                            type="text"
                            placeholder="Search by city..."
                            value={geographicSearch}
                            onChange={(e) => setGeographicSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-2"
                            style={{
                              backgroundColor: 'var(--input-bg, #ffffff)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {(() => {
                          const filteredLocations = companyData.geographic_data.all_locations
                            .filter(location => 
                              geographicSearch === '' || 
                              location.city.toLowerCase().includes(geographicSearch.toLowerCase())
                            )
                            .sort((a, b) => b.flagged_users - a.flagged_users)
                          
                          if (filteredLocations.length === 0) {
                            return (
                              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                                <p>No locations found matching "{geographicSearch}"</p>
                              </div>
                            )
                          }
                          
                          return filteredLocations.map((location, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded border"
                              style={{
                                backgroundColor: 'var(--hover-bg)',
                                borderColor: 'var(--border-color)'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                <div>
                                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {location.city}
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {location.total_users} users
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm" style={{ color: '#ef4444' }}>
                                  {location.flagged_users}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>flagged</p>
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="w-full relative" style={{ height: '500px' }}>
                      {/* Zoom Controls */}
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <button
                          onClick={() => setMapPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }))}
                          className="p-2 rounded-lg border-2 shadow-lg transition-all"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                          }}
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMapPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 0.5) }))}
                          className="p-2 rounded-lg border-2 shadow-lg transition-all"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                          }}
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMapPosition({ x: 0, y: 0, zoom: 1 })}
                          className="p-2 rounded-lg border-2 shadow-lg transition-all"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                          }}
                          title="Reset View"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>

                      {(() => {
                        const locations = companyData.geographic_data.all_locations
                        const maxFlagged = Math.max(...locations.map(l => l.flagged_users), 1)
                        
                        // Calculate dot sizes and colors based on flagged users (heat map)
                        const markers = locations.map(location => {
                          const intensity = location.flagged_users / maxFlagged
                          // Size: 4px to 24px based on flagged users
                          const size = Math.max(4, Math.min(24, 4 + (intensity * 20)))
                          
                          // Heat map color: yellow (low) -> orange -> red (high)
                          let red, green, blue
                          if (intensity < 0.33) {
                            // Yellow to Orange: (255, 255, 0) -> (255, 165, 0)
                            const t = intensity / 0.33
                            red = 255
                            green = Math.floor(255 - (90 * t))
                            blue = 0
                          } else if (intensity < 0.66) {
                            // Orange to Red-Orange: (255, 165, 0) -> (255, 100, 0)
                            const t = (intensity - 0.33) / 0.33
                            red = 255
                            green = Math.floor(165 - (65 * t))
                            blue = 0
                          } else {
                            // Red-Orange to Dark Red: (255, 100, 0) -> (200, 0, 0)
                            const t = (intensity - 0.66) / 0.34
                            red = Math.floor(255 - (55 * t))
                            green = Math.floor(100 - (100 * t))
                            blue = 0
                          }
                          const color = `rgb(${red}, ${green}, ${blue})`
                          
                          return {
                            name: location.city,
                            coordinates: [location.lon, location.lat],
                            flaggedUsers: location.flagged_users,
                            totalUsers: location.total_users,
                            size,
                            color,
                            intensity
                          }
                        })

                        const handleMouseDown = (e: React.MouseEvent) => {
                          // Don't start dragging if clicking on a marker
                          if ((e.target as HTMLElement).closest('circle')) {
                            return
                          }
                          setIsDragging(true)
                          setDragStart({ x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y })
                        }

                        const handleMarkerClick = (marker: typeof markers[0], e: React.MouseEvent) => {
                          e.stopPropagation()
                          setSelectedMarker({
                            name: marker.name,
                            flaggedUsers: marker.flaggedUsers,
                            totalUsers: marker.totalUsers,
                            coordinates: marker.coordinates
                          })
                        }

                        const handleMouseMove = (e: React.MouseEvent) => {
                          if (isDragging) {
                            setMapPosition(prev => ({
                              ...prev,
                              x: e.clientX - dragStart.x,
                              y: e.clientY - dragStart.y
                            }))
                          }
                        }

                        const handleMouseUp = () => {
                          setIsDragging(false)
                        }

                        const handleWheel = (e: React.WheelEvent) => {
                          e.preventDefault()
                          const delta = e.deltaY > 0 ? 0.9 : 1.1
                          setMapPosition(prev => ({
                            ...prev,
                            zoom: Math.max(0.5, Math.min(8, prev.zoom * delta))
                          }))
                        }

                        return (
                          <div
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            style={{
                              width: '100%',
                              height: '100%',
                              cursor: isDragging ? 'grabbing' : 'grab',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapPosition.zoom})`,
                                transformOrigin: 'center center',
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                width: '100%',
                                height: '100%'
                              }}
                            >
                              <ComposableMap
                                projectionConfig={{
                                  scale: 147,
                                  center: [0, 20]
                                }}
                                style={{ width: '100%', height: '100%' }}
                              >
                                <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                                  {({ geographies }) =>
                                    geographies.map((geo) => (
                                      <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="var(--card-bg)"
                                        stroke="var(--border-color)"
                                        style={{
                                          default: { outline: 'none' },
                                          hover: { outline: 'none', fill: 'var(--hover-bg)' },
                                          pressed: { outline: 'none' }
                                        }}
                                      />
                                    ))
                                  }
                                </Geographies>
                                {markers.map((marker, index) => (
                                  <Marker key={index} coordinates={marker.coordinates}>
                                    <g>
                                      {/* Outer glow for high concentration areas */}
                                      {marker.intensity > 0.5 && (
                                        <circle
                                          r={marker.size + 3}
                                          fill={marker.color}
                                          opacity={0.2}
                                          onClick={(e) => handleMarkerClick(marker, e)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      )}
                                      <circle
                                        r={marker.size}
                                        fill={marker.color}
                                        stroke="var(--bg-primary)"
                                        strokeWidth={marker.intensity > 0.7 ? 2 : 1}
                                        opacity={marker.intensity > 0.5 ? 0.9 : 0.7}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={(e) => handleMarkerClick(marker, e)}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = '1'
                                          e.currentTarget.style.strokeWidth = '3'
                                          e.currentTarget.style.transform = 'scale(1.2)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = marker.intensity > 0.5 ? '0.9' : '0.7'
                                          e.currentTarget.style.strokeWidth = marker.intensity > 0.7 ? '2' : '1'
                                          e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                      >
                                        <title>{`${marker.name}: ${marker.flaggedUsers} flagged users out of ${marker.totalUsers} total`}</title>
                                      </circle>
                                    </g>
                                  </Marker>
                                ))}
                              </ComposableMap>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Marker Info Modal */}
                  {selectedMarker && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                      onClick={() => setSelectedMarker(null)}
                    >
                      <div
                        className="rounded-lg border-2 p-6 max-w-md w-full"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-strong)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Location Details
                          </h3>
                          <button
                            onClick={() => setSelectedMarker(null)}
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
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                            <div>
                              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>City</p>
                              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {selectedMarker.name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <div>
                              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Users</p>
                              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {selectedMarker.totalUsers.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Flagged Users</p>
                              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                                {selectedMarker.flaggedUsers.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Flag Rate</p>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-2 rounded-full flex-1"
                                style={{ 
                                  backgroundColor: 'var(--border-color)',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    backgroundColor: '#ef4444',
                                    width: `${(selectedMarker.flaggedUsers / selectedMarker.totalUsers) * 100}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                {((selectedMarker.flaggedUsers / selectedMarker.totalUsers) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Coordinates: {selectedMarker.coordinates[0].toFixed(4)}, {selectedMarker.coordinates[1].toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Top Flagged Accounts Table */}
            <div 
              className="p-6 rounded-lg border-2 mb-8"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-strong)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Top Flagged Accounts
                </h3>
                <button
                  onClick={() => toggleSection('flaggedAccounts')}
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
                  {collapsedSections.flaggedAccounts ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {!collapsedSections.flaggedAccounts && (
                <>
                  {/* Search Input */}
                  <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search by email, risk level, or evidence..."
                    value={flaggedAccountsSearch}
                    onChange={(e) => setFlaggedAccountsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-2"
                    style={{
                      backgroundColor: 'var(--input-bg, #ffffff)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Risk Level
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Score
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Potential Borrowers
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Evidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredAccounts = companyData.top_flagged_accounts.data
                        .filter(account => {
                          if (flaggedAccountsSearch === '') return true
                          const searchLower = flaggedAccountsSearch.toLowerCase()
                          return (
                            account.user_email.toLowerCase().includes(searchLower) ||
                            account.risk_level.toLowerCase().includes(searchLower) ||
                            account.evidence_summary.toLowerCase().includes(searchLower)
                          )
                        })
                      
                      if (filteredAccounts.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                              No accounts found matching "{flaggedAccountsSearch}"
                            </td>
                          </tr>
                        )
                      }
                      
                      return filteredAccounts.map((account, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {account.user_email}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: account.risk_level === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: account.risk_level === 'Critical' ? '#ef4444' : '#f59e0b'
                              }}
                            >
                              {account.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {account.score.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {account.potential_borrowers}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {account.evidence_summary}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
