'use client'

import { Rocket, Mail, CheckCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function OnboardingPage() {
  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
            <h1 
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Onboarding
            </h1>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Get started with Unshared Labs by following these steps to integrate account sharing detection into your platform.
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Install the SDK
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Install the Unshared Labs Node.js SDK in your backend application.
                </p>
                <div 
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'var(--code-bg)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  npm install unshared-clientjs-sdk
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Get Your API Credentials
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Contact support@unsharedlabs.com to obtain your Client ID and API Key.
                </p>
                <a
                  href="mailto:support@unsharedlabs.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
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
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Initialize the SDK
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Initialize the SDK in your backend code with your credentials.
                </p>
                <div 
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'var(--code-bg)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {`const unshared_labs_client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
});`}
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Integrate Event Tracking
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Call processUserEvent() during login, signup, or when users access protected content.
                </p>
                <div 
                  className="p-4 rounded-lg font-mono text-sm"
                  style={{
                    backgroundColor: 'var(--code-bg)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {`await unshared_labs_client.processUserEvent(
  'login',
  userId,
  ipAddress,
  deviceId,
  sessionHash,
  userAgent,
  emailAddress,
  'paid'
);`}
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div 
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg"
                style={{
                  backgroundColor: 'var(--active-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Handle Flagged Users
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  When a user is flagged, trigger email verification and verify the code.
                </p>
                <div 
                  className="p-4 rounded-lg font-mono text-sm mb-4"
                  style={{
                    backgroundColor: 'var(--code-bg)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {`if (result.analysis.is_user_flagged) {
  await unshared_labs_client.triggerEmailVerification(
    emailAddress,
    deviceId
  );
}`}
                </div>
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <CheckCircle className="w-4 h-4" />
                  See the Documentation tab for complete implementation details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
