'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Building2, UserPlus, Users, Mail, User, X, Trash2, Shield, Edit2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface TeamMember {
  id: string
  user_id: string
  email: string
  role: string
  company_role?: 'admin' | 'member' | null
  created_at: string
  name?: string
}

interface Company {
  id: string
  name: string
  created_at: string
}

interface PendingInvitation {
  id: string
  email: string
  role: string
  company_role?: 'admin' | 'member' | null
  created_at: string
  expires_at: string
}

export default function CompanyPage() {
  const { user, refreshUser } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [myPendingInvitations, setMyPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isCreating, setIsCreating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompanyRole, setEditCompanyRole] = useState<'admin' | 'member'>('member')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditingCompanyName, setIsEditingCompanyName] = useState(false)
  const [editCompanyName, setEditCompanyName] = useState('')
  const [isUpdatingCompanyName, setIsUpdatingCompanyName] = useState(false)

  // Check if user is a company admin
  const isCompanyAdmin = user?.companyId && company && 
    teamMembers.find(m => m.user_id === user.id)?.company_role === 'admin'
  
  // Check if user has a company
  const hasCompany = !!user?.companyId && !!company

  useEffect(() => {
    fetchCompanyData()
    fetchMyPendingInvitations()
  }, [user])

  const fetchMyPendingInvitations = async () => {
    if (!user) return

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) return

      const response = await fetch('/api/invite/pending', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMyPendingInvitations(data.invitations || [])
        } else {
          setMyPendingInvitations([])
        }
      } else {
        setMyPendingInvitations([])
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
      setMyPendingInvitations([])
    }
  }

  const fetchCompanyData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        setIsLoading(false)
        return
      }

      // Always try to fetch company and members (even if user.companyId is not set)
      // This handles cases where the user has a company but companyId wasn't refreshed
      const membersResponse = await fetch('/api/companies/members', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      if (membersResponse.ok) {
        const data = await membersResponse.json()
        
        if (data.success && data.company) {
          setTeamMembers(data.members || [])
          setCompany(data.company)
          setPendingInvitations(data.invitations || [])
          setShowCreateCompany(false)
        } else {
          // No company found - show create form
          setShowCreateCompany(true)
        }
      } else if (membersResponse.status === 404) {
        // User doesn't have a company - show create form
        setShowCreateCompany(true)
      } else {
        // Error fetching - show create form as fallback
        setShowCreateCompany(true)
      }
    } catch (error) {
      console.error('❌ Error fetching company data:', error)
      // Show create form on error
      setShowCreateCompany(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return

    setIsCreating(true)
    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        return
      }

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ name: companyName.trim() }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        alert(`Server error: ${response.status} ${response.statusText}`)
        return
      }

      if (data.success) {
        setCompany(data.company)
        setShowCreateCompany(false)
        setCompanyName('')
        // Refresh user to get updated companyId
        await refreshUser()
        // Fetch members
        await fetchCompanyData()
      } else {
        const errorMsg = data.error || 'Failed to create company'
        const details = data.details ? `\n\nDetails: ${data.details}` : ''
        console.error('Create company error:', {
          error: data.error,
          details: data.details,
          status: response.status,
          fullResponse: data
        })
        alert(errorMsg + details)
      }
    } catch (error: any) {
      console.error('Error creating company:', error)
      alert(`An error occurred while creating the company: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated')
        return
      }

      const response = await fetch('/api/companies/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ 
          email: inviteEmail.trim(),
          company_role: inviteRole
        }),
      })

      const data = await response.json()

      if (data.success) {
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)
        alert('Invitation sent successfully')
        // Refresh members list
        await fetchCompanyData()
      } else {
        alert(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('An error occurred while sending the invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleStartEdit = (member: TeamMember) => {
    setEditingMember(member)
    setEditName(member.name || '')
    setEditCompanyRole(member.company_role || 'member')
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditName('')
    setEditCompanyRole('member')
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        return
      }

      setIsUpdating(true)

      const updateData: { name?: string | null; company_role?: 'admin' | 'member' } = {}
      if (editName.trim() !== (editingMember.name || '')) {
        updateData.name = editName.trim() || null
      }
      // Only allow role changes if user is admin editing someone else
      const isEditingSelf = editingMember.user_id === user?.id
      if (!isEditingSelf && isCompanyAdmin && editCompanyRole !== editingMember.company_role) {
        updateData.company_role = editCompanyRole
      }

      // Only send update if something changed
      if (Object.keys(updateData).length === 0) {
        handleCancelEdit()
        return
      }

      const response = await fetch(`/api/companies/members/${editingMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setTeamMembers(teamMembers.map(m => 
          m.id === editingMember.id 
            ? { ...m, name: data.member.name || m.name, company_role: data.member.company_role || m.company_role }
            : m
        ))
        handleCancelEdit()
        // Refresh company data
        await fetchCompanyData()
      } else {
        alert(data.error || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      alert('An error occurred while updating the member')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    const memberName = member?.name || member?.email || 'this member'
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the company?`)) {
      return
    }

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        return
      }

      const response = await fetch(`/api/companies/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setTeamMembers(teamMembers.filter(m => m.id !== memberId))
        // Refresh company data to update member count
        await fetchCompanyData()
      } else {
        alert(data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('An error occurred while removing the member')
    }
  }

  const handleDeleteCompany = async () => {
    setIsDeleting(true)
    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        return
      }

      const response = await fetch('/api/companies', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setCompany(null)
        setTeamMembers([])
        setShowCreateCompany(true)
        // Refresh user to clear companyId
        await refreshUser()
        alert('Company deleted successfully')
      } else {
        alert(data.error || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('An error occurred while deleting the company')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartEditCompanyName = () => {
    if (company) {
      setEditCompanyName(company.name)
      setIsEditingCompanyName(true)
    }
  }

  const handleCancelEditCompanyName = () => {
    setIsEditingCompanyName(false)
    setEditCompanyName('')
  }

  const handleUpdateCompanyName = async () => {
    if (!company || !editCompanyName.trim() || editCompanyName.trim() === company.name) {
      handleCancelEditCompanyName()
      return
    }

    setIsUpdatingCompanyName(true)
    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        return
      }

      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ name: editCompanyName.trim() }),
      })

      const data = await response.json()

      if (data.success && data.company) {
        setCompany(data.company)
        setIsEditingCompanyName(false)
        setEditCompanyName('')
        // Refresh user to get updated company name
        await refreshUser()
      } else {
        alert(data.error || 'Failed to update company name')
      }
    } catch (error) {
      console.error('Error updating company name:', error)
      alert('An error occurred while updating the company name')
    } finally {
      setIsUpdatingCompanyName(false)
    }
  }


  // Skeleton loader component
  const SkeletonLoader = () => (
    <>
      {/* Company Info Skeleton */}
      <div 
        className="p-6 rounded-lg border-2 mb-6 animate-pulse"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
            <div className="space-y-2">
              <div 
                className="h-6 w-48 rounded"
                style={{ backgroundColor: 'var(--hover-bg)' }}
              />
              <div 
                className="h-4 w-64 rounded"
                style={{ backgroundColor: 'var(--hover-bg)' }}
              />
            </div>
          </div>
          <div 
            className="h-10 w-32 rounded-lg"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="h-4 w-32 rounded"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
          <div 
            className="h-4 w-24 rounded"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
        </div>
      </div>

      {/* Team Members Skeleton */}
      <div 
        className="p-6 rounded-lg border-2"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-strong)'
        }}
      >
        <div 
          className="h-7 w-40 rounded mb-4 animate-pulse"
          style={{ backgroundColor: 'var(--hover-bg)' }}
        />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border-2 animate-pulse"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: 'var(--card-bg)' }}
                />
                <div className="space-y-2">
                  <div 
                    className="h-5 w-48 rounded"
                    style={{ backgroundColor: 'var(--card-bg)' }}
                  />
                  <div 
                    className="h-4 w-64 rounded"
                    style={{ backgroundColor: 'var(--card-bg)' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div 
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)' }}
                />
                <div 
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Company
            </h1>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {company ? 'Manage your team members and their roles' : 'Create a company to get started'}
            </p>
          </div>
          {company && isCompanyAdmin && !isLoading && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--active-bg)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--active-bg)'
              }}
            >
              <UserPlus className="w-5 h-5" />
              <span>Invite Member</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>

        {/* Pending Invitations for Me */}
        {!company && myPendingInvitations.length > 0 && (
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
              Pending Invitations
            </h2>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              You have been invited to join these companies:
            </p>
            <div className="space-y-3">
              {myPendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(invitation as any).companies?.name || 'Unknown Company'}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Invited as {invitation.company_role === 'admin' ? 'Admin' : 'Member'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = `/invite/accept?token=${(invitation as any).token}`
                    }}
                    className="px-4 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'var(--active-bg)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Accept Invitation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Company Form */}
        {showCreateCompany && !company && (
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
              Create Your Company
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Create a company and invite team members.
            </p>
            
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{
                    backgroundColor: 'var(--input-bg, #ffffff)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && companyName.trim()) {
                      handleCreateCompany()
                    }
                  }}
                />
              </div>
              
              <button
                onClick={handleCreateCompany}
                disabled={!companyName.trim() || isCreating}
                className="px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                {isCreating ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </div>
        )}

        {/* Company Info Card */}
        {company ? (
          <div 
            className="p-6 rounded-lg border-2 mb-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--active-bg)' }}
                >
                  <Building2 className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div className="flex-1">
                  {isEditingCompanyName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editCompanyName}
                        onChange={(e) => setEditCompanyName(e.target.value)}
                        className="px-3 py-1 rounded-lg border-2 text-xl font-semibold"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          flex: 1
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCompanyName()
                          } else if (e.key === 'Escape') {
                            handleCancelEditCompanyName()
                          }
                        }}
                      />
                      <button
                        onClick={handleUpdateCompanyName}
                        disabled={!editCompanyName.trim() || isUpdatingCompanyName}
                        className="px-3 py-1 rounded-lg transition-all text-sm"
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          opacity: (!editCompanyName.trim() || isUpdatingCompanyName) ? 0.5 : 1
                        }}
                      >
                        {isUpdatingCompanyName ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditCompanyName}
                        disabled={isUpdatingCompanyName}
                        className="px-3 py-1 rounded-lg transition-all text-sm"
                        style={{
                          backgroundColor: 'var(--hover-bg)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 
                        className="text-xl font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {company.name}
                      </h2>
                      {isCompanyAdmin && (
                        <button
                          onClick={handleStartEditCompanyName}
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
                          title="Edit company name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Company ID: {company.id}
                  </p>
                </div>
              </div>
              {isCompanyAdmin && !isEditingCompanyName && (
                <button
                  onClick={handleDeleteCompany}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-tertiary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                      e.currentTarget.style.color = '#ef4444'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Company'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}</span>
            </div>
          </div>
        ) : !isLoading && !showCreateCompany && (
          <div 
            className="p-6 rounded-lg border-2 mb-6 text-center"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>
              No company found. Check the browser console for errors.
            </p>
          </div>
        )}

        {/* Pending Invitations */}
        {company && pendingInvitations.length > 0 && (
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
              Pending Invitations
            </h2>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg border-2"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {invitation.email}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Invited as {invitation.company_role === 'admin' ? 'Admin' : 'Member'} • 
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {company && (
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Team Members
            </h2>

            {teamMembers.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet. Invite someone to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => {
                  const isCurrentUser = member.user_id === user?.id
                  const isAdmin = member.company_role === 'admin'
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border-2"
                      style={{
                        backgroundColor: 'var(--hover-bg)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--active-bg)' }}
                        >
                          {isAdmin ? (
                            <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                          ) : (
                            <User className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            {member.name || member.email}
                            {isCurrentUser && (
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                (You)
                              </span>
                            )}
                            {isAdmin && (
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: 'var(--active-bg)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Edit button - show for current user or if admin editing others */}
                        {(isCurrentUser || isCompanyAdmin) && (
                          <button
                            onClick={() => handleStartEdit(member)}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: 'var(--text-tertiary)' }}
                            title={isCurrentUser ? "Edit your profile" : "Edit member"}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                              e.currentTarget.style.color = 'var(--text-primary)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = 'var(--text-tertiary)'
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Remove button - only for admins removing others */}
                        {isCompanyAdmin && !isCurrentUser && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Remove member"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                              e.currentTarget.style.color = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = 'var(--text-tertiary)'
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <div 
              className="rounded-lg border-2 p-6 max-w-md w-full shadow-2xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-strong)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Invite Team Member
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 rounded-lg border-2"
                    style={{
                      backgroundColor: 'var(--input-bg, #ffffff)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      className="w-full px-4 py-2 pr-10 rounded-lg border-2 appearance-none"
                      style={{
                        backgroundColor: 'var(--input-bg, #ffffff)',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div 
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || isInviting}
                  className="flex-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--active-bg)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {editingMember && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={handleCancelEdit}
          >
            <div 
              className="rounded-lg border-2 p-6 max-w-md w-full shadow-2xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-strong)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {editingMember.user_id === user?.id ? 'Edit Your Profile' : 'Edit Team Member'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={editingMember.email}
                    className="w-full px-4 py-2 rounded-lg border-2"
                    style={{
                      backgroundColor: 'var(--input-bg, #ffffff)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Leave empty to use email as display name
                  </p>
                </div>

                {/* Only show company role field if user is admin (can edit others' roles) */}
                {isCompanyAdmin && editingMember.user_id !== user?.id && (
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Company Role
                    </label>
                    <div className="relative">
                      <select
                        value={editCompanyRole}
                        onChange={(e) => setEditCompanyRole(e.target.value as 'admin' | 'member')}
                        className="w-full px-4 py-2 pr-10 rounded-lg border-2 appearance-none"
                        style={{
                          backgroundColor: 'var(--input-bg, #ffffff)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div 
                        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMember}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--active-bg)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdating) {
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUpdating) {
                      e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                >
                  {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Company Confirmation Modal */}
        {showDeleteModal && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div 
              className="rounded-lg border-2 p-6 max-w-md w-full shadow-2xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-strong)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Delete Company
              </h3>
              
              <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{company?.name}</strong>? 
                This will remove all team members and cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteModal(false)
                    await handleDeleteCompany()
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = '#dc2626'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = '#ef4444'
                    }
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Company'}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
