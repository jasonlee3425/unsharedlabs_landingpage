'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Building2, Users, ArrowLeft, Shield, Mail } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  created_at: string
}

interface Client {
  id: string
  user_id: string
  email: string
  role: string
  company_id: string | null
  created_at: string
}

export default function CompanyDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
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

    if (user && user.role === 'super_admin' && companyId) {
      fetchCompanyData()
    }
  }, [user, isLoading, router, companyId])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      const sessionToken = localStorage.getItem('sb-access-token')
      
      if (!sessionToken) {
        setError('Not authenticated')
        return
      }

      // Fetch company details
      const companyResponse = await fetch(`/api/admin/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const companyData = await companyResponse.json()
      if (companyData.success) {
        setCompany(companyData.company)
      }

      // Fetch clients for this company
      const clientsResponse = await fetch(`/api/admin/companies/${companyId}/clients`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const clientsData = await clientsResponse.json()
      if (clientsData.success) {
        setClients(clientsData.clients || [])
      } else {
        setError(clientsData.error || 'Failed to fetch clients')
      }
    } catch (err: any) {
      console.error('Error fetching company data:', err)
      setError('Failed to load company data')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
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
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-silver hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Link>

            {company && (
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {company.name}
                  </h1>
                  <p className="text-silver">
                    Company Dashboard
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Clients ({clients.length})
              </h2>

              {clients.length === 0 ? (
                <div className="p-8 bg-black/30 rounded-lg border border-white/10 text-center">
                  <p className="text-silver">No clients found for this company</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="p-6 bg-black/30 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">
                            {client.email}
                          </h3>
                          <p className="text-sm text-silver/70">
                            Joined {new Date(client.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded-full">
                          <span className="text-sm text-silver capitalize">{client.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* This is where you would add company-specific data/analytics */}
            <div className="mt-8 p-6 bg-black/30 rounded-lg border border-white/10">
              <p className="text-silver">
                Company-specific analytics and data will be displayed here.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
