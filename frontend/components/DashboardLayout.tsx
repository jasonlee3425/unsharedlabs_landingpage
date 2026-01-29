'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  Code2,
  Zap,
  Book,
  Mail,
  AlertTriangle,
  CheckCircle,
  Building2,
  Rocket,
  Home,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Documentation Content Component (same as /docs page)
function DocumentationContent() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const codeBlocks = {
    install: `npm install unshared-clientjs-sdk
# or
yarn add unshared-clientjs-sdk`,
    quickStart: `import UnsharedLabsClient from "unshared-clientjs-sdk";

const unshared_labs_client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
});`,
    processUserEvent: `processUserEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  emailAddress: string,
  subscriptionStatus?: string | null,
  eventDetails?: Map<string, any> | null
): Promise<any>`,
    processUserEventExample: `const result = await unshared_labs_client.processUserEvent(
  'signup', // eventType
  'user@example.com', // userId
  '192.168.1.1', // ipAddress
  'device456', // deviceId
  'session789', // sessionHash
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // userAgent
  'user@example.com', // emailAddress
  'paid', // subscriptionStatus: 'paid', 'free', 'free trial', 'discounted', 'other'
  new Map([['source', 'web']]) // eventDetails (optional)
);

// Check if user is flagged
if (result.analysis.is_user_flagged) {
  // Handle flagged user - trigger verification
}`,
    processUserEventResponse: `{
  "success": true,
  "event": {
    "data": [...],
    "status": "success"
  },
  "analysis": {
    "status": "success",
    "is_user_flagged": true
  }
}`,
    checkUser: `checkUser(
  emailAddress: string,
  deviceId: string
): Promise<any>`,
    checkUserExample: `const result = await unshared_labs_client.checkUser(
  'user@example.com', // emailAddress
  'device456' // deviceId
);

if (result.is_user_flagged) {
  // User is flagged - trigger verification
}`,
    triggerEmailVerification: `triggerEmailVerification(
  emailAddress: string,
  deviceId: string
): Promise<any>`,
    triggerEmailExample: `const result = await unshared_labs_client.triggerEmailVerification(
  'user@example.com', // emailAddress
  'device456' // deviceId
);

// Returns: { success: true, message: "Email sent successfully", verificationCode: "123456" }`,
    verify: `verify(
  emailAddress: string,
  deviceId: string,
  code: string
): Promise<any>`,
    verifyExample: `const result = await unshared_labs_client.verify(
  'user@example.com', // emailAddress
  'device456', // deviceId
  '123456' // code: 6-digit verification code
);

if (result.pass) {
  // Verification successful - allow user to continue
} else {
  // Verification failed - prompt user to retry
}`,
    expressExample: `import express from "express";
import UnsharedLabsClient from "unshared-clientjs-sdk";

const app = express();
app.use(express.json());

const unshared_labs_client = new UnsharedLabsClient({
  clientId: process.env.UNSHARED_LABS_CLIENT_ID!,
  apiKey: process.env.UNSHARED_LABS_API_KEY!
});

app.post("/login", async (req, res) => {
  const { userId, emailAddress } = req.body;

  try {
    const result = await unshared_labs_client.processUserEvent(
      "login",
      userId,
      req.ip,
      req.headers["x-device-id"]?.toString() || "unknown-device",
      req.headers["x-session-hash"]?.toString() || "unknown-session",
      req.headers["user-agent"] || "",
      emailAddress,
      "paid" // subscriptionStatus
    );

    if (result.analysis.is_user_flagged) {
      // Trigger email verification
      await unshared_labs_client.triggerEmailVerification(
        emailAddress,
        req.headers["x-device-id"]?.toString() || "unknown-device"
      );
      return res.status(200).json({ 
        message: "Verification required",
        requiresVerification: true 
      });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));`
  }

  const CodeBlock = ({ code, index, language = 'typescript' }: { code: string, index: number, language?: string }) => (
    <div className="relative group">
      <div 
        className="code-block p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-x-auto rounded-lg"
        style={{
          backgroundColor: 'var(--code-bg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <button
          onClick={() => copyToClipboard(code, index)}
          className="absolute top-3 right-3 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          style={{
            backgroundColor: 'var(--hover-bg)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--active-bg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
          }}
        >
          {copiedIndex === index ? (
            <Check className="w-4 h-4" style={{ color: '#10b981' }} />
          ) : (
            <Copy className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          )}
        </button>
        <pre style={{ color: 'var(--text-tertiary)' }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs mb-4"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--hover-bg)',
            color: 'var(--text-tertiary)'
          }}
        >
          <Book className="w-3.5 h-3.5" />
          Developer Documentation
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          <span style={{ color: 'var(--text-primary)' }}>SDK</span>
          {' '}
          <span style={{ color: 'var(--text-tertiary)' }}>Documentation</span>
        </h1>
        <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span>Version: <code style={{ color: 'var(--text-primary)' }}>v1.0.14</code></span>
          <span>•</span>
          <span>Last Updated: <code style={{ color: 'var(--text-primary)' }}>Jan 12, 2026</code></span>
        </div>
        <p style={{ color: 'var(--text-tertiary)' }}>
          Integrate the Unshared Labs Node.js backend SDK to detect account sharing, send user events, 
          and handle email verification flows.
        </p>
      </div>

      {/* Documentation Content */}
      <div className="space-y-8">
        {/* Requirements */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Requirements</h2>
          </div>
          <div 
            className="p-4 sm:p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <ul className="space-y-2" style={{ color: 'var(--text-tertiary)' }}>
              <li>• Node.js v18.0.0 or later</li>
              <li>• Support for environment variables (for securely storing credentials)</li>
              <li>• An existing user authentication or session-validation flow</li>
              <li>• Access to Unshared Labs Admin Dashboard</li>
              <li>• Your Unshared Labs Client ID and API Key (contact support@unsharedlabs.com)</li>
            </ul>
          </div>
        </div>

        {/* Installation */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Terminal className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Installation</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>Install the SDK using npm or yarn:</p>
          <CodeBlock code={codeBlocks.install} index={0} language="bash" />
        </div>

        {/* Initializing the SDK */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Zap className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Initializing the SDK</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>Initialize the client with your Client ID and API Key:</p>
          <CodeBlock code={codeBlocks.quickStart} index={1} />
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Once initialized, the client exposes core functions: <code style={{ color: 'var(--text-primary)' }}>processUserEvent()</code>, 
            <code style={{ color: 'var(--text-primary)' }}> checkUser()</code>, <code style={{ color: 'var(--text-primary)' }}>triggerEmailVerification()</code>, and <code style={{ color: 'var(--text-primary)' }}>verify()</code>.
          </p>
        </div>

        {/* processUserEvent */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Code2 className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Sending Events: processUserEvent</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>
            Use <code style={{ color: 'var(--text-primary)' }}>processUserEvent</code> during login, signup, or when users access protected/paywalled areas. 
            This function both records the user event and evaluates whether the user is currently flagged.
          </p>
          <CodeBlock code={codeBlocks.processUserEvent} index={2} />
          
          {/* Parameters Table */}
          <div 
            className="p-4 sm:p-6 rounded-lg border mt-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Parameters</h3>
            <div className="space-y-3">
              {[
                { name: 'eventType', type: 'string (required)', desc: 'Type of event (e.g., "login", "signup", "pageview")' },
                { name: 'userId', type: 'string (required)', desc: 'Unique identifier for the user' },
                { name: 'ipAddress', type: 'string (required)', desc: 'Client IP address' },
                { name: 'deviceId', type: 'string (required)', desc: 'Unique device identifier' },
                { name: 'sessionHash', type: 'string (required)', desc: 'Session identifier hash' },
                { name: 'userAgent', type: 'string (required)', desc: 'Browser/client user agent string' },
                { name: 'emailAddress', type: 'string (required)', desc: 'User email address' },
                { name: 'subscriptionStatus', type: 'string (optional)', desc: '\'paid\', \'free\', \'free trial\', \'discounted\', \'other\', or null' },
                { name: 'eventDetails', type: 'Map (optional)', desc: 'Additional event metadata' },
              ].map((param, i) => (
                <div 
                  key={i} 
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <code className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{param.name}</code>
                  <span className="text-xs font-mono" style={{ color: '#10b981' }}>{param.type}</span>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{param.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4" style={{ color: 'var(--text-tertiary)' }}>Example usage:</p>
          <CodeBlock code={codeBlocks.processUserEventExample} index={3} />

          <p className="mt-4" style={{ color: 'var(--text-tertiary)' }}>Example response:</p>
          <CodeBlock code={codeBlocks.processUserEventResponse} index={4} language="json" />
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
            The <code style={{ color: 'var(--text-primary)' }}>analysis.is_user_flagged</code> field indicates whether the user is currently flagged for suspected account sharing.
          </p>
        </div>

        {/* checkUser */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Explicit User Checks: checkUser</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>
            A lightweight alternative that allows you to explicitly check whether a user is flagged without recording an event.
          </p>
          <CodeBlock code={codeBlocks.checkUser} index={5} />
          <CodeBlock code={codeBlocks.checkUserExample} index={6} />
        </div>

        {/* Handling Flagged Users */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Handling Flagged Users</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>When <code style={{ color: 'var(--text-primary)' }}>is_user_flagged</code> returns <code style={{ color: 'var(--text-primary)' }}>true</code>, follow this flow:</p>
          <div 
            className="p-4 sm:p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <ol className="space-y-3 list-decimal list-inside" style={{ color: 'var(--text-tertiary)' }}>
              <li>Present a verification prompt: Display your UI or modal informing the user that email verification is required.</li>
              <li>Send the verification email: Call <code style={{ color: 'var(--text-primary)' }}>triggerEmailVerification()</code> as described below.</li>
              <li>Collect the verification code: Prompt the user to enter the 6-digit code sent to their email.</li>
              <li>Verify the code: Call <code style={{ color: 'var(--text-primary)' }}>verify()</code> to complete verification.</li>
              <li>Resume the user flow: Upon successful verification, allow the user to proceed.</li>
            </ol>
          </div>
        </div>

        {/* Email Verification */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Mail className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Email Verification</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Triggering Email Verification</h3>
              <p className="mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Verification emails are not sent automatically. Your system must explicitly trigger them when a user requires verification.
              </p>
              <CodeBlock code={codeBlocks.triggerEmailVerification} index={7} />
              <CodeBlock code={codeBlocks.triggerEmailExample} index={8} />
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                <strong>Note:</strong> Before using this functionality, you must complete email service setup including approval of a sender email address (see Admin Dashboard section below).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Verifying the User&apos;s Code</h3>
              <p className="mb-3" style={{ color: 'var(--text-tertiary)' }}>After the user enters the 6-digit verification code:</p>
              <CodeBlock code={codeBlocks.verify} index={9} />
              <CodeBlock code={codeBlocks.verifyExample} index={10} />
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                If <code style={{ color: 'var(--text-primary)' }}>result.pass</code> is <code style={{ color: 'var(--text-primary)' }}>true</code>, verification succeeded. 
                If <code style={{ color: 'var(--text-primary)' }}>false</code>, the code was incorrect or expired.
              </p>
            </div>
          </div>
        </div>

        {/* Email Sender Approval */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Settings className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Email Sender Approval (Admin Dashboard)</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>Before sending verification emails, you must approve a sender email address in the Unshared Labs Admin Dashboard. This setup is required once per client.</p>
          <div 
            className="p-4 sm:p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Sender Approval Steps</h3>
            <ol className="space-y-2 list-decimal list-inside" style={{ color: 'var(--text-tertiary)' }}>
              <li>Log in to the Unshared Labs Admin Dashboard</li>
              <li>Navigate to Settings</li>
              <li>Enter the sender details (Sender Name and Sender Email)</li>
              <li>A 6-digit verification code will be sent to the provided sender email</li>
              <li>Enter the verification code in the dashboard</li>
              <li>Once verified, the sender email address will be marked as authenticated</li>
            </ol>
            <p className="text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>
              <strong>Domain Authentication:</strong> After approving a sender email, you must authenticate your sending domain via DNS records. 
              Contact <a href="mailto:support@unsharedlabs.com" className="underline" style={{ color: 'var(--text-primary)' }}>support@unsharedlabs.com</a> to obtain the required DNS records.
            </p>
          </div>
        </div>

        {/* Recommended Implementation Flow */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Zap className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recommended Implementation Flow</h2>
          </div>
          <div 
            className="p-4 sm:p-6 rounded-lg border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <ol className="space-y-3 list-decimal list-inside" style={{ color: 'var(--text-tertiary)' }}>
              <li>Install and initialize the SDK with your Client ID and API Key</li>
              <li>Call <code style={{ color: 'var(--text-primary)' }}>processUserEvent</code> during login or other session-related actions</li>
              <li>If <code style={{ color: 'var(--text-primary)' }}>is_user_flagged = true</code>:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Display your custom UI or modal informing the user that email verification is required</li>
                  <li>Trigger a verification email using <code style={{ color: 'var(--text-primary)' }}>triggerEmailVerification()</code></li>
                  <li>Collect the 6-digit code entered by the user</li>
                  <li>Call <code style={{ color: 'var(--text-primary)' }}>verify()</code> to complete the verification process</li>
                </ul>
              </li>
              <li>Handle verification outcomes:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>On success, allow the user to continue accessing your site normally</li>
                  <li>On failure, prompt the user to retry verification or trigger a new verification email</li>
                </ul>
              </li>
              <li>Optional: Display a discount, referral code, or promotional offer if verification failed</li>
            </ol>
          </div>
        </div>

        {/* Express Example */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Example: Express Server</h2>
          <p style={{ color: 'var(--text-tertiary)' }}>Complete example of handling login events and flagged users in an Express.js application:</p>
          <CodeBlock code={codeBlocks.expressExample} index={11} />
        </div>

        {/* Support Section */}
        <div 
          className="p-6 sm:p-8 rounded-lg border text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)'
          }}
        >
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Support</h2>
          <p className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
            For any questions about the SDK, integration assistance, or to obtain your Client ID and API Key, please contact us.
          </p>
          <a 
            href="mailto:support@unsharedlabs.com"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all"
          >
            support@unsharedlabs.com
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { effectiveTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showExpandArrow, setShowExpandArrow] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Ensure theme class is applied to container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.remove('light', 'dark')
      containerRef.current.classList.add(effectiveTheme)
    }
  }, [effectiveTheme])
  
  // Determine current view based on pathname
  const getCurrentView = () => {
    if (pathname === '/dashboard/settings') return 'settings'
    if (pathname === '/dashboard/company/onboarding') return 'onboarding'
    if (pathname === '/dashboard/company/prevention') return 'prevention'
    if (pathname === '/dashboard/company') return 'company'
    if (pathname === '/docs' || pathname?.includes('/docs')) return 'documentation'
    return 'dashboard'
  }
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'documentation' | 'settings' | 'company' | 'onboarding' | 'prevention'>(getCurrentView())
  
  // Update current view when pathname changes
  useEffect(() => {
    setCurrentView(getCurrentView())
  }, [pathname])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  const navItems = [
    {
      name: 'Dashboard',
      view: 'dashboard' as const,
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Company',
      view: 'company' as const,
      href: '/dashboard/company',
      icon: Building2,
    },
    {
      name: 'Onboarding',
      view: 'onboarding' as const,
      href: '/dashboard/company/onboarding',
      icon: Rocket,
    },
    {
      name: 'Prevention',
      view: 'prevention' as const,
      href: '/dashboard/company/prevention',
      icon: Shield,
    },
    {
      name: 'Documentation',
      view: 'documentation' as const,
      href: '/docs',
      icon: FileText,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  return (
    <div 
      ref={containerRef}
      data-theme-container
      className={`flex h-screen overflow-hidden ${effectiveTheme}`}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Sidebar */}
      <aside 
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 flex flex-col fixed md:relative h-full z-40 md:z-auto`}
        style={{
          backgroundColor: 'var(--sidebar-bg, var(--card-bg))',
          borderRight: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Logo */}
        <div 
          className="border-b"
          style={{ 
            borderColor: 'var(--border-color)',
            padding: sidebarOpen ? '1.5rem' : '1rem'
          }}
        >
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            {sidebarOpen ? (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--text-primary)' }}
                  >
                    <Shield 
                      className="w-6 h-6" 
                      style={{ color: 'var(--bg-primary)' }}
                    />
                  </div>
                  <span 
                    className="text-lg font-semibold tracking-tight whitespace-nowrap"
                    style={{ color: 'var(--sidebar-text-primary, var(--text-primary))' }}
                  >
                    Unshared Labs
                  </span>
                </Link>
                {/* Toggle Sidebar Button */}
                <button
                  onClick={() => {
                    if (window.innerWidth >= 768) {
                      setSidebarOpen(false)
                    } else {
                      setMobileMenuOpen(false)
                    }
                  }}
                  className="p-1.5 rounded transition-colors flex-shrink-0"
                  style={{ color: 'var(--sidebar-text-tertiary, var(--text-tertiary))' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--sidebar-text-primary, var(--text-primary))'
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover, var(--hover-bg))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--sidebar-text-tertiary, var(--text-tertiary))'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            ) : (
              /* Collapsed state - show logo, expand arrow on hover */
              <div className="relative flex items-center justify-center w-full">
                <div
                  className="flex items-center justify-center relative cursor-pointer"
                  onMouseEnter={() => setShowExpandArrow(true)}
                  onMouseLeave={() => setShowExpandArrow(false)}
                  onClick={() => {
                    if (window.innerWidth >= 768) {
                      setSidebarOpen(true)
                    }
                  }}
                >
                  <Link 
                    href="/dashboard" 
                    onClick={(e) => {
                      if (window.innerWidth >= 768) {
                        e.preventDefault()
                        setSidebarOpen(true)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className="flex items-center justify-center relative w-10 h-10"
                  >
                    {/* Logo - hidden on hover */}
                    <div 
                      className="absolute inset-0 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ 
                        backgroundColor: 'var(--text-primary)',
                        opacity: showExpandArrow ? 0 : 1,
                        transform: showExpandArrow ? 'scale(0.8)' : 'scale(1)'
                      }}
                    >
                      <Shield 
                        className="w-6 h-6 transition-all duration-200" 
                        style={{ color: 'var(--bg-primary)' }}
                      />
                    </div>
                    {/* Expand Arrow - replaces logo on hover */}
                    <div 
                      className="absolute inset-0 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ 
                        backgroundColor: 'var(--text-primary)',
                        opacity: showExpandArrow ? 1 : 0,
                        transform: showExpandArrow ? 'scale(1)' : 'scale(0.8)'
                      }}
                    >
                      <ChevronRight 
                        className="w-6 h-6" 
                        style={{ color: 'var(--bg-primary)' }}
                      />
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            // Prioritize currentView - if it's set to documentation, only documentation is active
            // Otherwise, check both currentView and pathname for other items
            const isActive = currentView === 'documentation'
              ? item.view === 'documentation'
              : (currentView === item.view || pathname === item.href)
            return (
              <button
                key={item.href}
                onClick={() => {
                  setCurrentView(item.view)
                  setMobileMenuOpen(false)
                  // Navigate for dashboard, company, onboarding, and prevention, show content in panel for documentation
                  if (item.view === 'dashboard' || item.view === 'company' || item.view === 'onboarding' || item.view === 'prevention') {
                    router.push(item.href)
                  } else if (item.view === 'documentation') {
                    // Ensure documentation is set as active
                    setCurrentView('documentation')
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active, var(--active-bg))' : 'transparent',
                  color: isActive 
                    ? 'var(--sidebar-text-primary, var(--text-primary))' 
                    : 'var(--sidebar-text-tertiary, var(--text-tertiary))',
                  borderLeft: isActive ? '3px solid var(--accent-color, #b58900)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover, var(--hover-bg))'
                    e.currentTarget.style.color = 'var(--sidebar-text-primary, var(--text-primary))'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--sidebar-text-tertiary, var(--text-tertiary))'
                  }
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Settings at Bottom */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={() => {
              setCurrentView('settings')
              setMobileMenuOpen(false)
              router.push('/dashboard/settings')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: (currentView === 'settings' || pathname === '/dashboard/settings') ? 'var(--sidebar-active, var(--active-bg))' : 'transparent',
              color: (currentView === 'settings' || pathname === '/dashboard/settings') 
                ? 'var(--sidebar-text-primary, var(--text-primary))' 
                : 'var(--sidebar-text-tertiary, var(--text-tertiary))',
              borderLeft: (currentView === 'settings' || pathname === '/dashboard/settings') ? '3px solid var(--accent-color, #b58900)' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'settings' && pathname !== '/dashboard/settings') {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-hover, var(--hover-bg))'
                e.currentTarget.style.color = 'var(--sidebar-text-primary, var(--text-primary))'
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'settings' && pathname !== '/dashboard/settings') {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--sidebar-text-tertiary, var(--text-tertiary))'
              }
            }}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header 
          className="h-16 flex items-center justify-between px-6 border-b"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Left: Dashboard Title */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentView === 'documentation' ? 'Documentation' 
                : currentView === 'settings' ? 'Settings' 
                : currentView === 'onboarding' ? 'Onboarding'
                : currentView === 'prevention' ? 'Prevention'
                : currentView === 'company' ? 'Company'
                : 'Dashboard'}
            </h1>
          </div>

          {/* Right: Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--active-bg)' }}
              >
                <User className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || user?.email}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-lg shadow-2xl py-2 z-50 border-2"
                style={{
                  backgroundColor: 'var(--modal-bg)',
                  borderColor: 'var(--border-strong)'
                }}
              >
                <div 
                  className="px-4 py-3 border-b-2"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user?.name || user?.email}
                  </p>
                  {user?.email && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {user.email}
                    </p>
                  )}
                </div>

                <div 
                  className="border-b-2"
                  style={{ borderColor: 'var(--border-strong)' }}
                />

                <Link
                  href="/"
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  <span>Landing Page</span>
                </Link>

                <div 
                  className="border-b-2 my-1"
                  style={{ borderColor: 'var(--border-strong)' }}
                />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'documentation' ? (
            <DocumentationContent />
          ) : (
            children
          )}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
