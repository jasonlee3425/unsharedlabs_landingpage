'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Building2, UserPlus, Users, Mail, User, X, Trash2, Shield, Edit2, Upload, Image as ImageIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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
  logo_url?: string | null
  website_url?: string | null
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
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')
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
  const [isEditingWebsite, setIsEditingWebsite] = useState(false)
  const [editWebsite, setEditWebsite] = useState('')
  const [isUpdatingWebsite, setIsUpdatingWebsite] = useState(false)
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [isCancellingInvitation, setIsCancellingInvitation] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDeletingLogo, setIsDeletingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [acceptingInvitation, setAcceptingInvitation] = useState<PendingInvitation | null>(null)
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false)
  const [acceptInvitationStatus, setAcceptInvitationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [acceptInvitationMessage, setAcceptInvitationMessage] = useState('')

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

  const handleAcceptInvitation = async () => {
    if (!acceptingInvitation || !(acceptingInvitation as any).token) return

    setIsAcceptingInvitation(true)
    setAcceptInvitationStatus('idle')
    setAcceptInvitationMessage('')

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        setAcceptInvitationStatus('error')
        setAcceptInvitationMessage('Not authenticated. Please sign in again.')
        return
      }

      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ token: (acceptingInvitation as any).token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setAcceptInvitationStatus('error')
        setAcceptInvitationMessage(data.error || `Failed to accept invitation (${response.status})`)
        return
      }

      if (data.success) {
        setAcceptInvitationStatus('success')
        setAcceptInvitationMessage('Invitation accepted successfully!')
        
        // Refresh user to get updated company info
        await refreshUser()
        
        // Refresh company data and pending invitations
        await fetchCompanyData()
        await fetchMyPendingInvitations()
        
        // Close modal after a short delay
        setTimeout(() => {
          setAcceptingInvitation(null)
          setAcceptInvitationStatus('idle')
          setAcceptInvitationMessage('')
        }, 2000)
      } else {
        setAcceptInvitationStatus('error')
        setAcceptInvitationMessage(data.error || 'Failed to accept invitation')
      }
    } catch (error) {
      setAcceptInvitationStatus('error')
      setAcceptInvitationMessage('An error occurred while accepting the invitation')
    } finally {
      setIsAcceptingInvitation(false)
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
        body: JSON.stringify({ 
          name: companyName.trim(),
          website_url: companyWebsite.trim() || null
        }),
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
        setCompanyWebsite('')
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
        const emailToShow = inviteEmail.trim()
        setInvitedEmail(emailToShow)
        setInviteEmail('')
        setInviteRole('member')
        setShowInviteModal(false)
        setShowInviteSuccessModal(true)
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
        body: JSON.stringify({ 
          name: editCompanyName.trim(),
          website_url: company.website_url || null
        }),
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

  const handleStartEditWebsite = () => {
    if (company) {
      setEditWebsite(company.website_url || '')
      setIsEditingWebsite(true)
    }
  }

  const handleCancelEditWebsite = () => {
    setIsEditingWebsite(false)
    setEditWebsite('')
  }

  const handleUpdateWebsite = async () => {
    if (!company) {
      handleCancelEditWebsite()
      return
    }

    const newWebsite = editWebsite.trim() || null
    if (newWebsite === (company.website_url || null)) {
      handleCancelEditWebsite()
      return
    }

    setIsUpdatingWebsite(true)
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
        body: JSON.stringify({ 
          name: company.name,
          website_url: newWebsite
        }),
      })

      const data = await response.json()

      if (data.success && data.company) {
        setCompany(data.company)
        setIsEditingWebsite(false)
        setEditWebsite('')
      } else {
        alert(data.error || 'Failed to update website')
      }
    } catch (error) {
      console.error('Error updating website:', error)
      alert('An error occurred while updating the website')
    } finally {
      setIsUpdatingWebsite(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setIsCancellingInvitation(invitationId)
    try {
      const sessionToken = getSessionToken()
      if (!sessionToken) {
        alert('Not authenticated. Please sign in again.')
        setIsCancellingInvitation(null)
        return
      }

      const response = await fetch(`/api/invite/cancel?invitationId=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Cancel invitation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error
        })
        alert(data.error || `Failed to cancel invitation (${response.status})`)
        setIsCancellingInvitation(null)
        return
      }

      if (data.success) {
        // Refresh invitations list
        await fetchCompanyData()
      } else {
        console.error('Failed to cancel invitation:', data.error)
        alert(data.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      alert('An error occurred while cancelling the invitation')
    } finally {
      setIsCancellingInvitation(null)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!company) return

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      setLogoError('File size exceeds 1MB limit')
      setTimeout(() => setLogoError(null), 5000)
      return
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Invalid file type. Allowed types: PNG, SVG, JPEG, WebP')
      setTimeout(() => setLogoError(null), 5000)
      return
    }

    setIsUploadingLogo(true)
    setLogoError(null)

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        setLogoError('Not authenticated')
        return
      }

      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.company) {
        setCompany(data.company)
      } else {
        setLogoError(data.error || 'Failed to upload logo')
        setTimeout(() => setLogoError(null), 5000)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setLogoError('An error occurred while uploading the logo')
      setTimeout(() => setLogoError(null), 5000)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!company || !company.logo_url) return

    if (!confirm('Are you sure you want to delete the company logo?')) {
      return
    }

    setIsDeletingLogo(true)
    setLogoError(null)

    try {
      const sessionToken = localStorage.getItem('sb-access-token')
      if (!sessionToken) {
        setLogoError('Not authenticated')
        return
      }

      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const data = await response.json()

      if (data.success && data.company) {
        setCompany(data.company)
      } else {
        setLogoError(data.error || 'Failed to delete logo')
        setTimeout(() => setLogoError(null), 5000)
      }
    } catch (error) {
      console.error('Error deleting logo:', error)
      setLogoError('An error occurred while deleting the logo')
      setTimeout(() => setLogoError(null), 5000)
    } finally {
      setIsDeletingLogo(false)
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
                      setAcceptingInvitation(invitation)
                      setAcceptInvitationStatus('idle')
                      setAcceptInvitationMessage('')
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
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://example.com"
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
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden border-2"
                    style={{ 
                      backgroundColor: 'var(--active-bg)',
                      borderColor: 'var(--border-strong)'
                    }}
                  >
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>
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
            {/* Website */}
            <div className="mt-3">
              {isEditingWebsite ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="px-3 py-1 rounded-lg border-2 text-sm"
                    style={{
                      backgroundColor: 'var(--input-bg, var(--card-bg))',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                      flex: 1
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateWebsite()
                      } else if (e.key === 'Escape') {
                        handleCancelEditWebsite()
                      }
                    }}
                  />
                  <button
                    onClick={handleUpdateWebsite}
                    disabled={isUpdatingWebsite}
                    className="px-3 py-1 rounded-lg transition-all text-sm"
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      opacity: isUpdatingWebsite ? 0.5 : 1
                    }}
                  >
                    {isUpdatingWebsite ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEditWebsite}
                    disabled={isUpdatingWebsite}
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
                  {company.website_url ? (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-all"
                      style={{ color: '#3b82f6' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                    >
                      {company.website_url}
                    </a>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No website set
                    </span>
                  )}
                  {isCompanyAdmin && (
                    <button
                      onClick={handleStartEditWebsite}
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
                      title="Edit website"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm mt-3" style={{ color: 'var(--text-tertiary)' }}>
              Company ID: {company.id}
            </p>
            {logoError && (
              <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <p style={{ color: '#ef4444' }}>{logoError}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}</span>
            </div>

            {/* Logo Upload Section - Admin Only */}
            {isCompanyAdmin && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Company Logo
                </h3>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    isDraggingOver ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: isDraggingOver ? '#3b82f6' : 'var(--border-strong)',
                    backgroundColor: isDraggingOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingOver(true)
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingOver(false)
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      handleLogoUpload(file)
                    }
                  }}
                >
                  {company.logo_url ? (
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--border-strong)' }}>
                        <img 
                          src={company.logo_url} 
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                          Logo uploaded successfully
                        </p>
                        <div className="flex items-center gap-2">
                          <label
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                            style={{ backgroundColor: '#10b981', color: 'white' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#10b981'
                            }}
                          >
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleLogoUpload(file)
                                }
                                e.target.value = ''
                              }}
                              disabled={isUploadingLogo}
                              className="hidden"
                            />
                            {isUploadingLogo ? 'Uploading...' : 'Change Logo'}
                          </label>
                          <button
                            onClick={handleDeleteLogo}
                            disabled={isDeletingLogo}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            style={{
                              backgroundColor: isDeletingLogo ? 'var(--hover-bg)' : 'rgba(239, 68, 68, 0.1)',
                              color: isDeletingLogo ? 'var(--text-tertiary)' : '#ef4444',
                              border: '1px solid #ef4444'
                            }}
                          >
                            {isDeletingLogo ? 'Deleting...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                      <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                        Upload a company logo
                      </p>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        Drag and drop an image here, or click to browse
                      </p>
                      <label
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981'
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleLogoUpload(file)
                            }
                            e.target.value = ''
                          }}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                        {isUploadingLogo ? 'Uploading...' : 'Choose File'}
                      </label>
                      <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                        PNG, SVG, JPEG, or WebP (max 1MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  {isCompanyAdmin && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isCancellingInvitation === invitation.id}
                      className="px-3 py-1.5 rounded-lg transition-all text-sm disabled:opacity-50"
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCancellingInvitation) {
                          e.currentTarget.style.backgroundColor = '#c82333'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCancellingInvitation) {
                          e.currentTarget.style.backgroundColor = '#dc3545'
                        }
                      }}
                    >
                      {isCancellingInvitation === invitation.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
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
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#10b981'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Success Modal */}
        {showInviteSuccessModal && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteSuccessModal(false)}
          >
            <div 
              className="rounded-lg border-2 p-6 max-w-md w-full shadow-2xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-strong)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10b981' }} />
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Invitation Sent Successfully
                </h3>
                <p 
                  className="text-sm mb-6"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  The invitation has been sent to <strong style={{ color: 'var(--text-primary)' }}>{invitedEmail}</strong>. They will receive an email with instructions to join your team.
                </p>
                <button
                  onClick={() => setShowInviteSuccessModal(false)}
                  className="w-full px-4 py-2 rounded-lg transition-all"
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
                  Close
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

        {/* Accept Invitation Modal */}
        {acceptingInvitation && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (acceptInvitationStatus !== 'success' && !isAcceptingInvitation) {
                setAcceptingInvitation(null)
                setAcceptInvitationStatus('idle')
                setAcceptInvitationMessage('')
              }
            }}
          >
            <div 
              className="rounded-lg border-2 p-6 max-w-md w-full shadow-2xl"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-strong)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {acceptInvitationStatus === 'idle' && !isAcceptingInvitation && (
                <>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Accept Invitation
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>
                    You are about to accept an invitation to join{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {(acceptingInvitation as any).companies?.name || 'this company'}
                    </strong>
                    {' '}as {acceptingInvitation.company_role === 'admin' ? 'an Admin' : 'a Member'}.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setAcceptingInvitation(null)
                        setAcceptInvitationStatus('idle')
                        setAcceptInvitationMessage('')
                      }}
                      className="flex-1 px-4 py-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'var(--hover-bg)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAcceptInvitation}
                      className="flex-1 px-4 py-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'var(--active-bg)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Accept
                    </button>
                  </div>
                </>
              )}

              {isAcceptingInvitation && (
                <div className="text-center py-4">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--text-primary)' }} />
                  <p style={{ color: 'var(--text-tertiary)' }}>Processing invitation...</p>
                </div>
              )}

              {acceptInvitationStatus === 'success' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#28a745' }} />
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Invitation Accepted!
                  </h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>{acceptInvitationMessage}</p>
                </div>
              )}

              {acceptInvitationStatus === 'error' && (
                <>
                  <div className="text-center py-4">
                    <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#dc3545' }} />
                    <h3 
                      className="text-xl font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Error
                    </h3>
                    <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>
                      {acceptInvitationMessage}
                    </p>
                    <button
                      onClick={() => {
                        setAcceptingInvitation(null)
                        setAcceptInvitationStatus('idle')
                        setAcceptInvitationMessage('')
                      }}
                      className="w-full px-4 py-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'var(--active-bg)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
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
