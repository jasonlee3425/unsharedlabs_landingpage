'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSessionToken } from '@/lib/auth'
import { Mail, Eye, Save, Code, Palette, Type, Image as ImageIcon, X, ChevronRight, UploadCloud, Loader2, ArrowLeft, Copy, Check, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmailTemplateConfig {
  // Logo
  logoUrl: string
  logoText: string
  logoTextColor: string
  logoPosition: 'above' | 'left' | 'right' | 'below'
  
  // Header
  headerTitle: string
  headerTitleColor: string
  
  // Content
  contentText: string
  contentTextColor: string
  
  // Verification Code Styling
  codeColor: string
  codeFontSize: string
  codeLetterSpacing: string
  codeFontFamily: string
  
  // Warning
  warningText: string
  warningTextColor: string
  
  // Footer
  footerText: string
  footerTextColor: string
  
  // Background colors
  bodyBackgroundColor: string
  containerBackgroundColor: string
  headerBackgroundColor: string
  footerBackgroundColor: string
  
  // Border colors
  headerBorderColor: string
  footerBorderColor: string
  
  // Custom mode
  isCustom: boolean
  customHtml: string
}

const DEFAULT_TEMPLATE: EmailTemplateConfig = {
  logoUrl: '',
  logoText: 'Company Name',
  logoTextColor: '#1a1a1a',
  logoPosition: 'left',
  headerTitle: 'Verify Your Email',
  headerTitleColor: '#1a1a1a',
  contentText: 'Please use the code below to verify your account access:',
  contentTextColor: '#4a4a4a',
  codeColor: '#1a1a1a',
  codeFontSize: '36px',
  codeLetterSpacing: '12px',
  codeFontFamily: "'Courier New', monospace",
  warningText: 'This verification code will expire in 10 minutes.',
  warningTextColor: '#4a4a4a',
  footerText: 'This is an automated message. Please do not reply to this email.',
  footerTextColor: '#9a9a9a',
  bodyBackgroundColor: '#f5f5f5',
  containerBackgroundColor: '#ffffff',
  headerBackgroundColor: '#ffffff',
  footerBackgroundColor: '#fafafa',
  headerBorderColor: '#f0f0f0',
  footerBorderColor: '#f0f0f0',
  isCustom: false,
  customHtml: ''
}

export default function EmailTemplatePage() {
  const { user } = useAuth()
  const companyId = user?.companyId

  const [config, setConfig] = useState<EmailTemplateConfig>(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showSourceCode, setShowSourceCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('123456')
  const router = useRouter()
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    if (companyId) {
      fetchEmailTemplate().then(() => {
        // After loading template, fetch company logo but don't override if template has a logo
        fetchCompanyLogo()
      })
    }
  }, [companyId])

  const fetchCompanyLogo = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    try {
      const res = await fetch('/api/companies/members', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json?.success && json.company) {
        if (json.company.logo_url) {
          setCompanyLogo(json.company.logo_url)
          // Only set as default if no custom logo is set in config
          setConfig(prev => {
            if (!prev.logoUrl) {
              return { ...prev, logoUrl: json.company.logo_url }
            }
            return prev
          })
        }
        // Set company name as default logo text if not already customized
        if (json.company.name) {
          setCompanyName(json.company.name)
          setConfig(prev => {
            if (prev.logoText === 'Company Name' || !prev.logoText) {
              return { ...prev, logoText: json.company.name }
            }
            return prev
          })
        }
      }
    } catch (e) {
      console.error('Failed to fetch company logo:', e)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!companyId) return

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      setLogoError('File size exceeds 1MB limit')
      setTimeout(() => setLogoError(null), 8000)
      return
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Invalid file type. Allowed types: PNG, SVG, JPEG, WebP')
      setTimeout(() => setLogoError(null), 8000)
      return
    }

    setIsUploadingLogo(true)
    setLogoError(null)

    try {
      const token = getSessionToken()
      if (!token) {
        setLogoError('Not authenticated')
        return
      }

      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.company?.logo_url) {
        // Store the uploaded logo URL in the email template config
        setConfig(prev => ({ ...prev, logoUrl: data.company.logo_url }))
        // Also update company logo state
        setCompanyLogo(data.company.logo_url)
      } else {
        setLogoError(data.error || 'Failed to upload logo')
        setTimeout(() => setLogoError(null), 8000)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setLogoError('An error occurred while uploading the logo')
      setTimeout(() => setLogoError(null), 8000)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleUseCompanyLogo = () => {
    if (companyLogo) {
      setConfig(prev => ({ ...prev, logoUrl: companyLogo }))
    }
  }

  const fetchEmailTemplate = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    try {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/verification/email-template`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json?.success) {
        if (json.emailTemplate) {
          // Try to parse if it's a config object, otherwise treat as custom HTML
          try {
            const parsed = JSON.parse(json.emailTemplate)
            if (parsed.isCustom) {
              setConfig({ ...DEFAULT_TEMPLATE, isCustom: true, customHtml: parsed.customHtml || '' })
            } else {
              setConfig({ ...DEFAULT_TEMPLATE, ...parsed })
            }
          } catch {
            // If not JSON, treat as custom HTML
            setConfig({ ...DEFAULT_TEMPLATE, isCustom: true, customHtml: json.emailTemplate })
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch email template:', e)
      setError('Failed to load email template')
    } finally {
      setLoading(false)
    }
  }

  const generateEmailHtml = (code: string = verificationCode): string => {
    if (config.isCustom) {
      // Replace verification code placeholder in custom HTML
      return config.customHtml.replace(/\{\{verificationCode\}\}/g, code)
    }

    const logoUrl = config.logoUrl || companyLogo || 'https://via.placeholder.com/32'
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${config.contentTextColor};
      margin: 0;
      padding: 0;
      background-color: ${config.bodyBackgroundColor};
    }
    .email-wrapper {
      background-color: ${config.bodyBackgroundColor};
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${config.containerBackgroundColor};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: ${config.headerBackgroundColor};
      padding: 40px 40px 15px 40px;
      text-align: center;
      border-bottom: 1px solid ${config.headerBorderColor};
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo.above, .logo.below {
      display: block;
    }
    .logo.left, .logo.right {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .logo.left {
      flex-direction: row;
    }
    .logo.right {
      flex-direction: row-reverse;
    }
    .logo img {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      display: inline-block;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${config.logoTextColor};
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo.above .logo-text {
      margin-top: 8px;
      display: block;
    }
    .logo.below .logo-text {
      margin-top: 8px;
      display: block;
    }
    .logo.left .logo-text, .logo.right .logo-text {
      display: inline-block;
    }
    .header h1 {
      color: ${config.headerTitleColor};
      font-size: 28px;
      margin: 0;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 15px 40px 40px 40px;
    }
    .content p {
      margin-bottom: 16px;
      font-size: 16px;
      color: ${config.contentTextColor};
      line-height: 1.6;
    }
    .verification-code {
      color: ${config.codeColor};
      font-size: ${config.codeFontSize};
      font-weight: 700;
      letter-spacing: ${config.codeLetterSpacing};
      text-align: center;
      padding: 18px 0;
      margin: 24px 0;
      font-family: ${config.codeFontFamily};
    }
    .warning {
      padding: 0;
      margin: 24px 0;
    }
    .warning p {
      margin: 0;
      font-size: 16px;
      color: ${config.warningTextColor};
      line-height: 1.6;
    }
    .footer {
      background-color: ${config.footerBackgroundColor};
      text-align: center;
      padding: 24px 40px;
      border-top: 1px solid ${config.footerBorderColor};
      color: ${config.footerTextColor};
      font-size: 13px;
    }
    .footer p {
      margin: 4px 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="logo ${config.logoPosition}">
          ${config.logoPosition === 'above' ? `
          <img src="${logoUrl}" alt="${config.logoText}" width="32" height="32">
          <div class="logo-text">${config.logoText}</div>
          ` : ''}
          ${config.logoPosition === 'left' ? `
          <img src="${logoUrl}" alt="${config.logoText}" width="32" height="32">
          <div class="logo-text">${config.logoText}</div>
          ` : ''}
          ${config.logoPosition === 'right' ? `
          <div class="logo-text">${config.logoText}</div>
          <img src="${logoUrl}" alt="${config.logoText}" width="32" height="32">
          ` : ''}
          ${config.logoPosition === 'below' ? `
          <div class="logo-text">${config.logoText}</div>
          <img src="${logoUrl}" alt="${config.logoText}" width="32" height="32">
          ` : ''}
        </div>
        <h1>${config.headerTitle}</h1>
      </div>
      <div class="content">
        <p>${config.contentText}</p>
        
        <div class="verification-code">
          ${code}
        </div>
        
        <div class="warning">
          <p>${config.warningText}</p>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
      </div>
      <div class="footer">
        <p>${config.footerText}</p>
      </div>
    </div>
  </div>
</body>
</html>`
  }

  const handleSave = async () => {
    if (!companyId) return
    const token = getSessionToken()
    if (!token) return

    setSaving(true)
    setError(null)

    try {
      const emailHtml = config.isCustom 
        ? config.customHtml 
        : generateEmailHtml()

      // Save as JSON config for template mode, or raw HTML for custom mode
      const templateToSave = config.isCustom
        ? config.customHtml
        : JSON.stringify(config)

      const res = await fetch(`/api/companies/${companyId}/verification/email-template`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailTemplate: templateToSave })
      })

      const json = await res.json()
      if (json?.success) {
        // Also mark step 3 as complete
        try {
          const stepRes = await fetch(`/api/companies/${companyId}/verification`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ step: 3 })
          })
          const stepJson = await stepRes.json()
          if (!stepJson?.success) {
            console.error('Failed to mark step 3 as complete:', stepJson?.error)
          }
        } catch (stepError) {
          console.error('Error marking step 3 as complete:', stepError)
          // Don't fail the save if marking step complete fails
        }
        setShowSuccessModal(true)
      } else {
        setError(json?.error || 'Failed to save email template')
      }
    } catch (e: any) {
      console.error('Failed to save email template:', e)
      setError(e.message || 'Failed to save email template')
    } finally {
      setSaving(false)
    }
  }

  const handleSwitchToCustom = () => {
    if (confirm('Switch to custom HTML mode? Your current template settings will be lost.')) {
      const defaultCustomHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-wrapper {
      background-color: #f5f5f5;
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Your custom HTML here -->
      <!-- Use {{verificationCode}} as placeholder for the 6-digit code -->
      <div style="padding: 40px; text-align: center;">
        <h1>Verify Your Email</h1>
        <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">{{verificationCode}}</strong></p>
      </div>
    </div>
  </div>
</body>
</html>`
      setConfig({ ...DEFAULT_TEMPLATE, isCustom: true, customHtml: defaultCustomHtml })
    }
  }

  const handleSwitchToTemplate = () => {
    if (confirm('Switch to template mode? Your custom HTML will be lost.')) {
      setConfig({ ...DEFAULT_TEMPLATE, isCustom: false })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8">
          <p style={{ color: 'var(--text-tertiary)' }}>Loading email template...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/company/prevention')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--hover-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--active-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Prevention</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Email Template Editor
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: showPreview ? 'var(--hover-bg)' : '#3b82f6',
                  color: showPreview ? 'var(--text-primary)' : 'white',
                  border: showPreview ? '1px solid var(--border-strong)' : 'none'
                }}
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: saving ? 'var(--hover-bg)' : '#10b981',
                  color: saving ? 'var(--text-tertiary)' : 'white',
                  opacity: saving ? 0.5 : 1
                }}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Customize your verification email template. Changes are shown in real-time in the preview.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Editor Panel */}
          <div className={`flex-1 overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'}`}>
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={config.isCustom ? handleSwitchToTemplate : handleSwitchToCustom}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: config.isCustom ? 'var(--hover-bg)' : '#10b981',
                  color: config.isCustom ? 'var(--text-primary)' : 'white',
                  border: config.isCustom ? '1px solid var(--border-strong)' : 'none'
                }}
              >
                <Code className="w-4 h-4" />
                <span>{config.isCustom ? 'Switch to Template' : 'Switch to Custom HTML'}</span>
              </button>
            </div>

            {config.isCustom ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Custom HTML Template
                  </label>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Use <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--code-bg)' }}>{'{{verificationCode}}'}</code> as a placeholder for the 6-digit verification code.
                  </p>
                  <textarea
                    value={config.customHtml}
                    onChange={(e) => setConfig(prev => ({ ...prev, customHtml: e.target.value }))}
                    className="w-full h-96 p-3 rounded-lg font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--code-bg)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)',
                      fontFamily: 'monospace'
                    }}
                    placeholder="Enter your custom HTML template..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Logo Section */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Logo</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Logo
                      </label>
                      
                      {/* Show current logo */}
                      {config.logoUrl && (
                        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center gap-3">
                            <img 
                              src={config.logoUrl} 
                              alt="Email template logo"
                              className="w-16 h-16 object-contain rounded"
                              style={{ border: '1px solid var(--border-color)' }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Current Logo
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {config.logoUrl === companyLogo ? 'Using company logo' : 'Custom logo'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Company logo option */}
                      {companyLogo && config.logoUrl !== companyLogo && (
                        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                          <div className="flex items-center gap-3">
                            <img 
                              src={companyLogo} 
                              alt="Company logo"
                              className="w-16 h-16 object-contain rounded"
                              style={{ border: '1px solid var(--border-color)' }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Company Logo
                              </p>
                              <button
                                type="button"
                                onClick={handleUseCompanyLogo}
                                className="mt-1 px-3 py-1 text-xs rounded transition-all"
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2563eb'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#3b82f6'
                                }}
                              >
                                Use This Logo
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upload area */}
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ 
                          borderColor: isDraggingOver ? '#3b82f6' : 'var(--border-color)', 
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
                        <UploadCloud className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                          Drag & drop your logo here, or
                        </p>
                        <label
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                          style={{ backgroundColor: '#3b82f6', color: 'white' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6'
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
                          {isUploadingLogo ? 'Uploading...' : 'Choose File'}
                        </label>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                          PNG, SVG, JPEG, or WebP (max 1MB)
                        </p>
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'white' }} />
                          </div>
                        )}
                      </div>

                      {logoError && (
                        <div className="mt-3 p-3 rounded-lg flex items-start justify-between gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                          <p className="text-sm flex-1" style={{ color: '#ef4444' }}>
                            {logoError}
                          </p>
                          <button
                            type="button"
                            onClick={() => setLogoError(null)}
                            className="flex-shrink-0 p-1 rounded hover:bg-red-200/20 transition-colors"
                            style={{ color: '#ef4444' }}
                            aria-label="Close error"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Logo Text
                      </label>
                      <input
                        type="text"
                        value={config.logoText}
                        onChange={(e) => setConfig(prev => ({ ...prev, logoText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Logo Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.logoTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, logoTextColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.logoTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, logoTextColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Logo Position
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['above', 'left', 'right', 'below'] as const).map((position) => (
                          <button
                            key={position}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, logoPosition: position }))}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                              config.logoPosition === position ? 'ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: config.logoPosition === position ? '#3b82f6' : 'var(--hover-bg)',
                              color: config.logoPosition === position ? 'white' : 'var(--text-primary)',
                              border: config.logoPosition === position ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                              ringColor: '#3b82f6'
                            }}
                            onMouseEnter={(e) => {
                              if (config.logoPosition !== position) {
                                e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (config.logoPosition !== position) {
                                e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                              }
                            }}
                          >
                            {position}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        Choose where the logo appears relative to the company name
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Section */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Header</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Header Title
                      </label>
                      <input
                        type="text"
                        value={config.headerTitle}
                        onChange={(e) => setConfig(prev => ({ ...prev, headerTitle: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Header Title Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.headerTitleColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerTitleColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.headerTitleColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerTitleColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Header Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.headerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.headerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Header Border Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.headerBorderColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerBorderColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.headerBorderColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, headerBorderColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Content</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Content Text
                      </label>
                      <textarea
                        value={config.contentText}
                        onChange={(e) => setConfig(prev => ({ ...prev, contentText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Content Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.contentTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, contentTextColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.contentTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, contentTextColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Code Styling */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Verification Code Styling</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Code Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.codeColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, codeColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.codeColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, codeColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Code Font Size
                      </label>
                      <input
                        type="text"
                        value={config.codeFontSize}
                        onChange={(e) => setConfig(prev => ({ ...prev, codeFontSize: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        placeholder="e.g., 36px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Code Letter Spacing
                      </label>
                      <input
                        type="text"
                        value={config.codeLetterSpacing}
                        onChange={(e) => setConfig(prev => ({ ...prev, codeLetterSpacing: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        placeholder="e.g., 12px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Code Font Family
                      </label>
                      <input
                        type="text"
                        value={config.codeFontFamily}
                        onChange={(e) => setConfig(prev => ({ ...prev, codeFontFamily: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        placeholder="e.g., 'Courier New', monospace"
                      />
                    </div>
                  </div>
                </div>

                {/* Warning Section */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Warning Message</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Warning Text
                      </label>
                      <input
                        type="text"
                        value={config.warningText}
                        onChange={(e) => setConfig(prev => ({ ...prev, warningText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Warning Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.warningTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, warningTextColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.warningTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, warningTextColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Footer</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Footer Text
                      </label>
                      <textarea
                        value={config.footerText}
                        onChange={(e) => setConfig(prev => ({ ...prev, footerText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Footer Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.footerTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerTextColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.footerTextColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerTextColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Footer Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.footerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.footerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Footer Border Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.footerBorderColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerBorderColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.footerBorderColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, footerBorderColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Colors */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Background Colors</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Body Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.bodyBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, bodyBackgroundColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.bodyBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, bodyBackgroundColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Container Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.containerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, containerBackgroundColor: e.target.value }))}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.containerBackgroundColor}
                          onChange={(e) => setConfig(prev => ({ ...prev, containerBackgroundColor: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--input-bg, var(--card-bg))',
                            borderColor: 'var(--border-strong)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-strong)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 border-l overflow-y-auto" style={{ borderColor: 'var(--border-strong)' }}>
              <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-strong)' }}>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Live Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSourceCode(!showSourceCode)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: showSourceCode ? 'var(--hover-bg)' : 'transparent',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-strong)'
                    }}
                    onMouseEnter={(e) => {
                      if (!showSourceCode) {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showSourceCode) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <Code className="w-4 h-4" />
                    <span>{showSourceCode ? 'Hide Source' : 'View Source'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="p-1 rounded transition-all"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {!showSourceCode ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Test Verification Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--input-bg, var(--card-bg))',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-strong)' }}>
                      <iframe
                        srcDoc={generateEmailHtml(verificationCode)}
                        className="w-full"
                        style={{ height: '600px', border: 'none' }}
                        title="Email Preview"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        HTML Source Code
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const html = generateEmailHtml(verificationCode)
                          await navigator.clipboard.writeText(html)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: copied ? '#10b981' : 'var(--hover-bg)',
                          color: copied ? 'white' : 'var(--text-primary)',
                          border: '1px solid var(--border-strong)'
                        }}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy HTML</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-strong)' }}>
                      <pre className="p-4 overflow-x-auto text-xs font-mono" style={{ 
                        backgroundColor: 'var(--card-bg)', 
                        color: 'var(--text-primary)',
                        maxHeight: '600px',
                        overflowY: 'auto'
                      }}>
                        <code>{generateEmailHtml(verificationCode)}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-strong)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Success!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Email template saved successfully.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push('/dashboard/company/prevention')
                }}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981'
                }}
              >
                Return to Prevention
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
