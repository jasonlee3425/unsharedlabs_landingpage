/**
 * Email service using Brevo API
 * Handles sending invitation emails
 */

import { getInviteEmailSubject, getInviteEmailHtml, getInviteEmailText } from '../templates/emails/invite'

interface SendInviteEmailParams {
  to: string
  inviterDisplayName: string
  companyName: string
  inviteToken: string
  role: string
}

export async function sendInviteEmail({
  to,
  inviterDisplayName,
  companyName,
  inviteToken,
  role,
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'support@unsharedlabs.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'Unshared Labs'

    if (!brevoApiKey) {
      console.error('❌ BREVO_API_KEY is not set')
      return { success: false, error: 'Email service not configured' }
    }

    const signupUrl = `${siteUrl}/signup?invite=${inviteToken}`

    // Get email template
    const subject = getInviteEmailSubject({ inviterDisplayName, companyName })
    const htmlContent = getInviteEmailHtml({ inviterDisplayName, companyName, role, signupUrl })
    const textContent = getInviteEmailText({ inviterDisplayName, companyName, role, signupUrl })

    // Brevo API endpoint for transactional emails
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent,
        textContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Brevo API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      return {
        success: false,
        error: `Failed to send email: ${response.statusText}`,
      }
    }

    const data = await response.json().catch(() => ({ messageId: 'unknown' }))
    console.log('✅ Invitation email sent successfully:', data.messageId)

    return { success: true }
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}
