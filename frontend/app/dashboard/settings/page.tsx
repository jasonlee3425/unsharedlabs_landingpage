'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon, Monitor } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

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
      </div>
    </DashboardLayout>
  )
}
