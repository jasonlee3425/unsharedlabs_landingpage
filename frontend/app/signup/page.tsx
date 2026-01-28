'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth'
import { useAuthUpdate } from '@/lib/auth-context'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function SignUp() {
  const router = useRouter()
  const { updateUser } = useAuthUpdate()
  const [isSignIn, setIsSignIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: ''
  })

  // Check URL parameter on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const mode = params.get('mode')
      if (mode === 'signin') {
        setIsSignIn(true)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      if (isSignIn) {
        // Sign in
        const result = await signIn(formData.email, formData.password)
        if (result.success && result.user) {
          updateUser(result.user)
          router.push('/dashboard')
        } else {
          setError(result.error || 'Failed to sign in. Please check your credentials and try again.')
        }
      } else {
        // Sign up - validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters')
          setIsLoading(false)
          return
        }

        const result = await signUp(
          formData.email, 
          formData.password,
          formData.companyName.trim() || undefined
        )
        if (result.success) {
          setSuccess('Account created! Please check your email to confirm your account, then sign in.')
          setFormData({ email: '', password: '', confirmPassword: '', companyName: '' })
        } else {
          setError(result.error || 'Failed to create account')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear errors when user types
    if (error) setError(null)
  }

  const switchMode = () => {
    setIsSignIn(!isSignIn)
    setError(null)
    setSuccess(null)
    // Reset form when switching modes
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      companyName: ''
    })
  }

  return (
    <main className="relative overflow-hidden min-h-screen pt-16">
      {/* Sign Up Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 grid-pattern">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
        
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="gradient-border p-8 sm:p-10"
          >
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 mb-8 p-1 bg-black/30 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setIsSignIn(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isSignIn
                    ? 'bg-white text-black'
                    : 'text-silver hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setIsSignIn(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isSignIn
                    ? 'bg-white text-black'
                    : 'text-silver hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                {isSignIn ? (
                  <>
                    <span className="text-gradient-white">Welcome back</span>
                    <br />
                    <span className="text-gradient-silver">Sign in</span>
                  </>
                ) : (
                  <>
                    <span className="text-gradient-white">Create your</span>
                    <br />
                    <span className="text-gradient-silver">account</span>
                  </>
                )}
              </h1>
              <p className="text-silver text-sm sm:text-base">
                {isSignIn
                  ? 'Sign in to your account to continue.'
                  : (<>Start protecting your revenue today.<br />It&apos;s completely free to start.</>)}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm text-silver mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-silver" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-silver/50 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm text-silver mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-silver" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-silver/50 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password Field - Only show for Sign Up */}
              {!isSignIn && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-silver mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-silver" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isSignIn}
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-silver/50 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Company Name Field - Only show for Sign Up */}
              {!isSignIn && (
                <div>
                  <label htmlFor="companyName" className="block text-sm text-silver mb-2">
                    Company Name <span className="text-silver/50">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-silver" />
                    </div>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-silver/50 focus:outline-none focus:border-white/30 focus:bg-black/70 transition-all"
                      placeholder="Your Company"
                    />
                  </div>
                  <p className="text-xs text-silver/70 mt-1">
                    If you&apos;re signing up for a company, enter the company name here.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary group flex items-center justify-center gap-2 px-6 py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignIn ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isSignIn ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-silver">
                {isSignIn ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-white hover:text-silver transition-colors font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-white hover:text-silver transition-colors font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Terms - Only show for Sign Up */}
            {!isSignIn && (
              <p className="text-xs text-silver/70 text-center mt-6">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-silver hover:text-white transition-colors underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-silver hover:text-white transition-colors underline">
                  Privacy Policy
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  )
}
