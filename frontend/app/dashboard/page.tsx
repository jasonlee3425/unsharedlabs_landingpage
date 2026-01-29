'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Building2, Users, AlertTriangle, DollarSign, MapPin, BarChart3, TrendingUp, Activity, Search, ChevronDown, ChevronUp, Map, List, ZoomIn, ZoomOut, RotateCcw, X, Rocket } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { useDashboard } from './_hooks/useDashboard'
import { CompanyData } from './_types/dashboard.types'
import SummaryCards from './_components/analytics/SummaryCards'
import SkeletonLoader from './_components/shared/SkeletonLoader'
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from './_components/shared/Charts'
import { formatNumber, formatCurrency } from './_utils/dashboard.utils'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const {
    companyData,
    dataLoading,
    dataError,
    onboardingCompleted,
    onboardingProgress,
    onboardingState,
    hasNewIncompleteTechStack,
    newTechStacks,
    hasPreviouslyCompletedStacks,
    hasIncompleteOnboarding,
  } = useDashboard(user?.companyId, isLoading)
  const [dismissedDashboardNotification, setDismissedDashboardNotification] = useState(false)
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

  // Chart components are now imported from _components/shared/Charts
  // Keeping geographic map and other complex sections inline for now

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
            <SummaryCards data={companyData.summary} />

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
                            coordinates: marker.coordinates as [number, number]
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
                                  {({ geographies }: { geographies: any[] }) =>
                                    geographies.map((geo: any) => (
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
