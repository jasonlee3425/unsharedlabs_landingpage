'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

type DemoStep = 'home' | 'login' | 'tooltip' | 'verification' | 'code-input' | 'conversion'

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('home')
  const [loginData, setLoginData] = useState({ email: 'demo@email.com', password: 'demopassword' })
  const [verificationCode, setVerificationCode] = useState('123456')
  const [showLoginTooltip, setShowLoginTooltip] = useState(true)

  // Reset demo when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('home')
      setLoginData({ email: 'demo@email.com', password: 'demopassword' })
      setVerificationCode('123456')
      setShowLoginTooltip(true)
    }
  }, [isOpen])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('tooltip')
  }

  const handleNext = () => {
    if (currentStep === 'tooltip') {
      setCurrentStep('verification')
    } else if (currentStep === 'verification') {
      setCurrentStep('code-input')
    }
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('conversion')
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setCurrentStep('home')
      setLoginData({ email: 'demo@email.com', password: 'demopassword' })
      setVerificationCode('123456')
      setShowLoginTooltip(true)
    }, 300)
  }

  const handleExitDemo = () => {
    onClose()
    setTimeout(() => {
      // Scroll to the "Setup in Minutes" section and center it
      const setupSection = document.getElementById('setup-in-minutes')
      if (setupSection) {
        setupSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Reset demo state
      setCurrentStep('home')
      setLoginData({ email: 'demo@email.com', password: 'demopassword' })
      setVerificationCode('123456')
      setShowLoginTooltip(true)
    }, 300)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container - Light theme like try-exponenet-demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
            style={{ position: 'relative' }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Demo Website Content */}
            <div className="overflow-y-auto max-h-[90vh] rounded-xl">
              {/* Navigation */}
              <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                  <div className="text-xl font-bold text-black">Demo</div>
                  <div className="flex gap-3 relative">
                    {currentStep === 'home' && (
                      <>
                        <div className="relative">
                          <button
                            id="demo-login-btn"
                            onClick={() => {
                              setShowLoginTooltip(false)
                              setCurrentStep('login')
                            }}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium relative z-30"
                          >
                            Log in
                          </button>
                          {/* Login Tooltip */}
                          {showLoginTooltip && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="absolute right-0 top-[52px] z-40 w-64 overflow-visible"
                            >
                              <div className="bg-white rounded-lg shadow-2xl border-4 border-blue-400 p-2 relative">
                                {/* Arrow pointing up to login button - positioned to touch button bottom */}
                                <div 
                                  className="absolute -top-[10px] right-9 z-10"
                                  style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: '10px solid #3b82f6',
                                  }}
                                />
                                <div 
                                  className="absolute -top-[7px] right-9 z-10"
                                  style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '9px solid transparent',
                                    borderRight: '9px solid transparent',
                                    borderBottom: '9px solid white',
                                  }}
                                />
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-lg">👆</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 mb-1">Press here</p>
                                  <p className="text-xs text-gray-600 mb-3">Click "Log in" to start the demo</p>
                                  <div className="bg-blue-50 p-4 rounded" style={{ marginLeft: '-1.25rem', marginRight: '-0.5rem' }}>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      <strong>Context:</strong> You have successfully integrated Unshared Labs SDK and the detection engine has been learning user behaviors.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setShowLoginTooltip(false)}
                                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <button
                          disabled
                          className="px-4 py-2 bg-blue-600 text-white rounded-md opacity-50 cursor-not-allowed font-medium"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                    {currentStep !== 'home' && currentStep !== 'login' && (
                      <div className="text-sm text-gray-600">Demo Mode</div>
                    )}
                  </div>
                </div>
              </nav>

              {/* Hero Section - Always show website background */}
              <section className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                  <h1 className="text-3xl font-bold mb-3 leading-tight">
                    Premium Content<br />Unlocked with Subscription
                  </h1>
                  <p className="text-base opacity-95">
                    Access exclusive courses, articles, videos, and more with your premium membership.
                  </p>
                </div>
              </section>

              {/* Premium Content Section */}
              <section className="bg-white py-8 px-6">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">Premium Content</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-5 rounded-xl shadow-sm border-2 border-gray-200 relative">
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
                      <div className="text-3xl mb-3">📚</div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Premium Courses</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Access exclusive courses taught by industry experts. Full access requires a subscription.
                      </p>
                      <div className="text-xs text-gray-500 font-medium">🔒 Subscription Required</div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl shadow-sm border-2 border-gray-200 relative">
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
                      <div className="text-3xl mb-3">📰</div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Exclusive Articles</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Read in-depth articles and analysis available only to premium members.
                      </p>
                      <div className="text-xs text-gray-500 font-medium">🔒 Subscription Required</div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl shadow-sm border-2 border-gray-200 relative">
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
                      <div className="text-3xl mb-3">🎥</div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">Premium Videos</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        Watch exclusive video content and tutorials reserved for paying subscribers.
                      </p>
                      <div className="text-xs text-gray-500 font-medium">🔒 Subscription Required</div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-3">
                      <span className="text-xl">💳</span>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-900">Premium Membership Required</p>
                        <p className="text-xs text-gray-600">All premium content requires an active subscription</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Modals overlay - appear above website background */}
            {currentStep !== 'home' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 overflow-y-auto px-4" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
                  {/* Login Modal */}
                  {currentStep === 'login' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl"
                    >
                      <h2 className="text-3xl font-bold mb-6 text-gray-900">Log in</h2>
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <label htmlFor="demo-email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            id="demo-email"
                            value={loginData.email}
                            readOnly
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-black placeholder:text-black"
                            placeholder="demo@email.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="demo-password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            id="demo-password"
                            value={loginData.password}
                            readOnly
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-black placeholder:text-black"
                            placeholder="demopassword"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        >
                          Log in & Continue
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* Unshared Labs Tooltip */}
                  {currentStep === 'tooltip' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl my-auto"
                    >
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-3">ℹ️</div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          With Unshared Labs' lightweight SDK already installed, real session behavior is observed over time.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Legitimate users experience no disruption.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          When repeated usage patterns indicate account sharing, the customer can choose to enforce access using Unshared Labs' account verification service.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-red-50 p-3 rounded-md mb-4 border-l-4 border-red-600">
                          <p className="text-xs text-red-700 leading-relaxed">
                            In this demo, this user has been flagged for account sharing. Customer has opted to use Unshared Labs' account verification service.
                          </p>
                        </div>
                        <button
                          onClick={handleNext}
                          className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Email Verification Modal */}
                  {currentStep === 'verification' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl"
                    >
                      <div className="text-center mb-6">
                        <div className="text-5xl mb-4">✉️</div>
                        <h2 className="text-3xl font-bold mb-3 text-gray-900">Verify your account using Unshared Labs' account verification service</h2>
                        <p className="text-gray-600 text-sm">
                          An email was sent containing a verification code. Please check your inbox.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <button
                          onClick={handleNext}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Code Input */}
                  {currentStep === 'code-input' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl"
                    >
                      <h2 className="text-3xl font-bold mb-2 text-gray-900 text-center">Enter verification code</h2>
                      <p className="text-gray-600 mb-6 text-center">
                        Enter the 6-digit code from your email to complete verification.
                      </p>
                      <form onSubmit={handleCodeSubmit} className="space-y-5">
                        <div>
                          <label htmlFor="demo-verification-code" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            id="demo-verification-code"
                            value={verificationCode}
                            readOnly
                            required
                            maxLength={6}
                            className="w-full text-center text-2xl tracking-widest font-mono px-4 py-4 border border-gray-300 rounded-md bg-white cursor-not-allowed text-black placeholder:text-black"
                            placeholder="123456"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        >
                          Verify Code & Continue
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* Conversion Modal */}
                  {currentStep === 'conversion' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl my-auto"
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <div className="text-3xl">⚠️</div>
                          <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
                        </div>
                        <p className="text-gray-600 text-xs mb-3 text-center">
                          The verification code was incorrect or has timed out.
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                        <div className="bg-white rounded-md p-3 border-2 border-dashed border-blue-300 mb-3">
                          <p className="text-xs text-gray-600 mb-1 text-center">Example discount code:</p>
                          <p className="text-xl font-bold text-blue-600 text-center tracking-wider">SAVE20</p>
                          <p className="text-xs text-gray-500 text-center mt-1">20% off your first month</p>
                        </div>
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium opacity-50 cursor-not-allowed text-sm"
                        >
                          Sign Up & Save
                        </button>
                      </div>
                      <button
                        onClick={handleExitDemo}
                        className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors text-left"
                      >
                        <p className="text-xs leading-relaxed mb-2">
                          This is an example of how Unshared Labs helps convert account borrowers into paying customers. When verification fails or times out, you can offer a discount code to incentivize sign-ups and drive revenue growth.
                        </p>
                        <p className="text-xs font-semibold text-center">Exit Demo</p>
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
