/**
 * Email service using Brevo API
 * Handles sending invitation emails
 */

interface SendInviteEmailParams {
  to: string
  inviterName: string
  companyName: string
  inviteToken: string
  role: string
}

export async function sendInviteEmail({
  to,
  inviterName,
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

    const inviteUrl = `${siteUrl}/invite/accept?token=${inviteToken}`
    const signupUrl = `${siteUrl}/signup?invite=${inviteToken}`

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
        subject: `${inviterName} invited you to join ${companyName}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Company Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
              <h1 style="color: #2c3e50; margin-top: 0;">You've been invited!</h1>
              
              <p style="font-size: 16px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.
              </p>
              
              <div style="margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you don't have an account yet, you'll need to sign up first:
              </p>
              
              <div style="margin: 20px 0;">
                <a href="${signupUrl}" 
                   style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                  Sign Up & Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                If the buttons don't work, copy and paste these links into your browser:<br>
                Accept invitation: <a href="${inviteUrl}" style="color: #007bff;">${inviteUrl}</a><br>
                Sign up first: <a href="${signupUrl}" style="color: #28a745;">${signupUrl}</a>
              </p>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                This invitation will expire in 7 days.
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
          You've been invited!
          
          ${inviterName} has invited you to join ${companyName} as a ${role}.
          
          Accept your invitation here: ${inviteUrl}
          
          If you don't have an account yet, sign up first: ${signupUrl}
          
          This invitation will expire in 7 days.
        `,
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
