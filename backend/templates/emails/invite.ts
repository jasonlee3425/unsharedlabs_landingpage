/**
 * Email template for team member invitations
 */

interface InviteEmailTemplateParams {
  inviterDisplayName: string
  companyName: string
  role: string
  signupUrl: string
}

export function getInviteEmailSubject(params: { inviterDisplayName: string; companyName: string }): string {
  return `${params.inviterDisplayName} invited you to join ${params.companyName}`
}

export function getInviteEmailHtml(params: InviteEmailTemplateParams): string {
  const { inviterDisplayName, companyName, role, signupUrl } = params

  return `
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
          <strong>${inviterDisplayName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.
        </p>
        
        <p style="font-size: 16px; margin: 30px 0;">
          Click the button below to get started. You'll need to create an account if you don't have one yet.
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${signupUrl}" 
             style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation & Get Started
          </a>
        </div>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${signupUrl}" style="color: #10b981; word-break: break-all;">${signupUrl}</a>
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    </body>
    </html>
  `
}

export function getInviteEmailText(params: InviteEmailTemplateParams): string {
  const { inviterDisplayName, companyName, role, signupUrl } = params

  return `
You've been invited!

${inviterDisplayName} has invited you to join ${companyName} as a ${role}.

Click the link below to get started. You'll need to create an account if you don't have one yet.

${signupUrl}

This invitation will expire in 7 days.
  `.trim()
}
