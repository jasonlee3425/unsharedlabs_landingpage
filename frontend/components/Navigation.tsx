'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Menu, X, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Navigation() {
  const pathname = usePathname()
  const { user, isLoading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [hash, setHash] = useState('')
  const [mounted, setMounted] = useState(false)

  // Track URL hash changes
  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return
    
    const updateHash = () => setHash(window.location.hash)
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  // Also update hash when pathname changes (for navigation from other pages)
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      setHash(window.location.hash)
    }
  }, [pathname, mounted])

  // Close desktop profile menu on escape or outside click
  useEffect(() => {
    if (!profileMenuOpen || typeof window === 'undefined') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Close unless the click is within the profile menu container
      if (target.closest('[data-profile-menu-container]')) return
      setProfileMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [profileMenuOpen])

  const isLoggedIn = !!user
  const isDocsPage = pathname === '/docs'
  const isPricingPage = pathname === '/pricing'
  const isHomePage = pathname === '/'
  const isHowItWorks = isHomePage && hash === '#how-it-works'
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')
  
  // Don't show navigation on dashboard pages (they have their own layout)
  if (isDashboardPage) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }

  // Get the appropriate "How it Works" link based on current page
  const howItWorksHref = isHomePage ? '#how-it-works' : '/#how-it-works'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg sm:text-xl font-semibold tracking-tight">Unshared Labs</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href={howItWorksHref}
            className={`text-sm transition-colors ${
              isHowItWorks 
                ? 'text-white font-medium' 
                : 'text-silver hover:text-white'
            }`}
          >
            How it Works
          </Link>
          <Link 
            href="/pricing" 
            className={`text-sm transition-colors ${
              isPricingPage 
                ? 'text-white font-medium' 
                : 'text-silver hover:text-white'
            }`}
          >
            Pricing
          </Link>
          <Link 
            href="/docs" 
            className={`text-sm transition-colors ${
              isDocsPage 
                ? 'text-white font-medium' 
                : 'text-silver hover:text-white'
            }`}
          >
            Documentation
          </Link>
        </div>
        
        {/* Desktop CTA - Only show on md and above (when hamburger menu is hidden) */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            /* Placeholder to prevent layout shift */
            <div className="w-20 h-8" />
          ) : isLoggedIn ? (
            <div className="relative" data-profile-menu-container>
              <button
                type="button"
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen(v => !v)}
                className="p-2 rounded-lg text-silver hover:text-white hover:bg-white/5 transition-colors"
              >
                <UserCircle className="w-6 h-6" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-black/95 backdrop-blur-md shadow-lg overflow-hidden"
                  >
                    <Link
                      href={user?.role === 'super_admin' ? '/admin' : '/dashboard'}
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-silver hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {user?.role === 'super_admin' ? 'Admin Dashboard' : 'Dashboard'}
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-silver hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/signin" className="text-sm text-silver hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="btn-primary px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-off-white transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              {!isLoading && isLoggedIn && (
                <Link
                  href={user?.role === 'super_admin' ? '/admin' : '/dashboard'}
                  className="block text-base transition-colors text-silver hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.role === 'super_admin' ? 'Admin Dashboard' : 'Dashboard'}
                </Link>
              )}
              <Link 
                href={howItWorksHref}
                className={`block text-base transition-colors ${
                  isHowItWorks ? 'text-white font-medium' : 'text-silver hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                href="/pricing" 
                className={`block text-base transition-colors ${
                  isPricingPage ? 'text-white font-medium' : 'text-silver hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/docs" 
                className={`block text-base transition-colors ${
                  isDocsPage ? 'text-white font-medium' : 'text-silver hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
              {!isLoading && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {isLoggedIn ? (
                    <>
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left text-base text-silver hover:text-white transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/signin" 
                        className="block w-full text-left text-base text-silver hover:text-white transition-colors" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link 
                        href="/signup" 
                        className="block w-full btn-primary px-4 py-3 text-base font-medium bg-white text-black rounded-lg hover:bg-off-white transition-all text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
