'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Building2, Users, ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  created_at: string
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
      return
    }

    if (!isLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }

    if (user && user.role === 'super_admin') {
      fetchCompanies()
    }
  }, [user, isLoading, router])

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const sessionToken = localStorage.getItem('sb-access-token')
      
      if (!sessionToken) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/admin/companies', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setCompanies(data.companies || [])
      } else {
        setError(data.error || 'Failed to fetch companies')
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err)
      setError('Failed to load companies')
    } finally {
      setLoadingCompanies(false)
    }
  }

  if (isLoading || loadingCompanies) {
    return (
      <main className="relative min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-silver" />
      </main>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return null
  }

  return (
    <main className="relative min-h-screen pt-16">
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="gradient-border p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-silver">
                  Manage clients and companies
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Companies
              </h2>

              {companies.length === 0 ? (
                <div className="p-8 bg-black/30 rounded-lg border border-white/10 text-center">
                  <p className="text-silver mb-4">No companies found</p>
                  <p className="text-silver/70 text-sm">
                    Companies will appear here once clients sign up and create accounts.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {companies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/admin/companies/${company.id}`}
                      className="group p-6 bg-black/30 rounded-lg border border-white/10 hover:border-white/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-white/90">
                              {company.name}
                            </h3>
                            <p className="text-sm text-silver/70">
                              {new Date(company.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-silver group-hover:text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-silver">
                        <Users className="w-4 h-4" />
                        <span>View clients</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
