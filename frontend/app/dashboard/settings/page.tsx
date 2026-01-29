'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Sun, Moon, Monitor, RotateCcw, AlertTriangle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Settings
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Manage your account preferences and settings
          </p>
        </div>

        {/* Theme Settings */}
        <div 
          className="p-6 rounded-lg border-2 mb-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)'
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Appearance
          </h2>
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Choose your preferred theme. System will match your device settings.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => setTheme('light')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
              style={{
                backgroundColor: theme === 'light' ? 'var(--active-bg)' : 'transparent',
                color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: theme === 'light' ? '1px solid var(--border-color)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (theme !== 'light') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== 'light') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <Sun className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium">Light</div>
                <div className="text-xs opacity-75">Solarized light theme</div>
              </div>
              {theme === 'light' && (
                <span className="text-sm">✓</span>
              )}
            </button>

            <button
              onClick={() => setTheme('dark')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--active-bg)' : 'transparent',
                color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: theme === 'dark' ? '1px solid var(--border-color)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (theme !== 'dark') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== 'dark') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <Moon className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium">Dark</div>
                <div className="text-xs opacity-75">Dark theme</div>
              </div>
              {theme === 'dark' && (
                <span className="text-sm">✓</span>
              )}
            </button>

            <button
              onClick={() => setTheme('system')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left"
              style={{
                backgroundColor: theme === 'system' ? 'var(--active-bg)' : 'transparent',
                color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: theme === 'system' ? '1px solid var(--border-color)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (theme !== 'system') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== 'system') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <Monitor className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium">System</div>
                <div className="text-xs opacity-75">Match your device settings</div>
              </div>
              {theme === 'system' && (
                <span className="text-sm">✓</span>
              )}
            </button>
          </div>
        </div>

        {/* Onboarding Reset - Only for Company Admins */}
        {user?.companyRole === 'admin' && (
          <div 
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Onboarding
            </h2>
            <p 
              className="text-sm mb-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Reset your onboarding progress. This will mark all steps as incomplete and prevent dashboard data from displaying until onboarding is complete again.
            </p>
            
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Onboarding</span>
            </button>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => !isResetting && setShowResetModal(false)}
        >
          <div 
            className="max-w-md w-full p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Reset Onboarding Progress?
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  This will mark all onboarding steps as incomplete. <strong>Your dashboard will not display data until onboarding is complete again.</strong> Are you sure you want to continue?
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: 'var(--hover-bg)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  opacity: isResetting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isResetting) {
                    e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isResetting) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user?.companyId) return
                  setIsResetting(true)
                  try {
                    const token = getSessionToken()
                    if (!token) throw new Error('Not authenticated')
                    
                    const res = await fetch(`/api/companies/${user.companyId}/onboarding`, {
                      method: 'PUT',
                      headers: { 
                        'Content-Type': 'application/json', 
                        Authorization: `Bearer ${token}` 
                      },
                      body: JSON.stringify({ 
                        state: {
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
                        },
                        completed: false
                      })
                    })
                    
                    const json = await res.json()
                    if (!res.ok || !json?.success) {
                      throw new Error(json?.error || 'Reset failed')
                    }
                    
                    await refreshUser()
                    setShowResetModal(false)
                    router.push('/dashboard/company/onboarding')
                  } catch (error) {
                    console.error('Failed to reset onboarding:', error)
                    alert('Failed to reset onboarding. Please try again.')
                  } finally {
                    setIsResetting(false)
                  }
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                style={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white',
                  opacity: isResetting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isResetting) {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isResetting) {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                  }
                }}
              >
                {isResetting ? 'Resetting...' : 'Reset Onboarding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
