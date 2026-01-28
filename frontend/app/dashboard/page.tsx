'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Shield, Loader2, Building2 } from 'lucide-react'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
      return
    }

    // Redirect super admins to admin dashboard
    if (!isLoading && user && user.role === 'super_admin') {
      router.push('/admin')
      return
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <main className="relative min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-silver" />
      </main>
    )
  }

  if (!user) {
    return null
  }

  // If user is super admin, they'll be redirected, but show loading while redirecting
  if (user.role === 'super_admin') {
    return (
      <main className="relative min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-silver" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen pt-16">
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-border p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Welcome to your Dashboard
                </h1>
                <p className="text-silver">
                  Signed in as {user.email}
                </p>
              </div>
            </div>

            {user.companyName && (
              <div className="mt-6 p-6 bg-black/30 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">Company</h2>
                </div>
                <p className="text-silver">{user.companyName}</p>
              </div>
            )}
            
            <div className="mt-8 p-6 bg-black/30 rounded-lg border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Your Company Data</h2>
              <p className="text-silver mb-4">
                This dashboard shows data specific to your company. You can only see data for {user.companyName || 'your company'}.
              </p>
              <div className="p-4 bg-black/20 rounded border border-white/5">
                <p className="text-silver/70 text-sm">
                  Company-specific analytics and data will be displayed here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
