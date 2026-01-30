'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  Zap, 
  Book, 
  Shield, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Server,
  Smartphone,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function Docs() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'tech-stack' | 'ai'>('tech-stack')
  const [selectedTechStack, setSelectedTechStack] = useState<string | null>('nodejs')
  const [techStackSelectorCollapsed, setTechStackSelectorCollapsed] = useState(false)

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

  const aiInstructions = `# Unshared Labs Integration Guide for AI Agents

## Overview
Unshared Labs is a service that helps detect and prevent account sharing by analyzing user behavior patterns and requiring email verification when suspicious activity is detected.

## Core Functionality
- **Account Sharing Detection**: Analyzes user events (login, signup, page views) to identify potential account sharing
- **Email Verification**: Sends 6-digit verification codes via email when users are flagged
- **User Event Tracking**: Records and analyzes user behavior patterns

## Integration Requirements
1. **Client ID**: Unique identifier for your company (found in Admin Dashboard)
2. **API Key**: Secret key for authenticating API requests (found in Admin Dashboard)
3. **SDK Installation**: Install the appropriate SDK for your tech stack
4. **Email Service Setup**: Configure sender email and domain authentication (done in Admin Dashboard)

## Key Functions

### processUserEvent()
Called during user actions (login, signup, page views) to:
- Record the user event
- Analyze if the user is flagged for account sharing
- Returns: \`{ analysis: { is_user_flagged: boolean } }\`

### triggerEmailVerification()
Sends a 6-digit verification code to the user's email when they are flagged.
- Parameters: emailAddress, deviceId
- Returns: \`{ success: boolean, verificationCode: string }\`

### verify()
Validates the 6-digit code entered by the user.
- Parameters: emailAddress, deviceId, code
- Returns: \`{ pass: boolean }\`

## Implementation Flow
1. Install SDK and initialize with Client ID and API Key
2. Call \`processUserEvent()\` during login/signup
3. If \`is_user_flagged === true\`:
   - Display verification UI to user
   - Call \`triggerEmailVerification()\`
   - Collect 6-digit code from user
   - Call \`verify()\` with the code
4. If verification passes, allow user to continue

## Important Notes
- Email verification must be set up in Admin Dashboard before use
- Domain authentication via DNS records is required
- Verification codes expire after 10 minutes
- Failed verifications can be retried

## Support
For integration help: support@unsharedlabs.com`

  const CodeBlock = ({ code, index, language = 'typescript' }: { code: string, index: number, language?: string }) => (
    <div className="relative group">
      <div className="code-block p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-x-auto rounded-lg bg-black/50 border border-white/10">
        <button
          onClick={() => copyToClipboard(code, index)}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copiedIndex === index ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-silver" />
          )}
        </button>
        <pre className="text-silver">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )

  const techStacks = [
    // Backend
    { id: 'nodejs', name: 'Node.js', icon: Server, available: true, category: 'backend' },
    { id: 'python', name: 'Python', icon: Server, available: false, category: 'backend' },
    { id: 'ruby', name: 'Ruby', icon: Server, available: false, category: 'backend' },
    { id: 'java', name: 'Java', icon: Server, available: false, category: 'backend' },
    { id: 'go', name: 'Go', icon: Server, available: false, category: 'backend' },
    // Frontend
    { id: 'react', name: 'React', icon: Code2, available: false, category: 'frontend' },
    { id: 'nextjs', name: 'Next.js', icon: Code2, available: false, category: 'frontend' },
    { id: 'vue', name: 'Vue.js', icon: Code2, available: false, category: 'frontend' },
    { id: 'angular', name: 'Angular', icon: Code2, available: false, category: 'frontend' },
    { id: 'svelte', name: 'Svelte', icon: Code2, available: false, category: 'frontend' },
    // Mobile
    { id: 'react-native', name: 'React Native', icon: Smartphone, available: false, category: 'mobile' },
    { id: 'flutter', name: 'Flutter', icon: Smartphone, available: false, category: 'mobile' },
    { id: 'ios', name: 'iOS (Swift)', icon: Smartphone, available: false, category: 'mobile' },
    { id: 'android', name: 'Android (Kotlin)', icon: Smartphone, available: false, category: 'mobile' },
    // Miscellaneous
    { id: 'wordpress', name: 'WordPress', icon: Globe, available: false, category: 'miscellaneous' },
    { id: 'shopify', name: 'Shopify', icon: Globe, available: false, category: 'miscellaneous' },
    { id: 'webflow', name: 'Webflow', icon: Globe, available: false, category: 'miscellaneous' },
    { id: 'squarespace', name: 'Squarespace', icon: Globe, available: false, category: 'miscellaneous' },
  ]

  return (
    <main className="relative min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-silver mb-4">
            <Book className="w-3.5 h-3.5" />
            Developer Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gradient-white">SDK</span>
            {' '}
            <span className="text-gradient-silver">Documentation</span>
          </h1>
          {activeTab === 'tech-stack' && selectedTechStack === 'nodejs' && (
            <div className="flex items-center gap-4 mb-4 text-sm text-silver">
              <span>Version: <code className="text-white">v1.0.14</code></span>
              <span>•</span>
              <span>Last Updated: <code className="text-white">Jan 12, 2026</code></span>
            </div>
          )}
          <p className="text-silver text-base sm:text-lg max-w-2xl">
            Integrate the Unshared Labs SDK to detect account sharing, send user events, 
            and handle email verification flows.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => {
              setActiveTab('tech-stack')
              setSelectedTechStack('nodejs')
            }}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${
              activeTab === 'tech-stack' ? 'text-white' : 'text-silver hover:text-white'
            }`}
            style={{
              borderBottom: activeTab === 'tech-stack' ? '2px solid white' : '2px solid transparent',
              marginBottom: '-2px'
            }}
          >
            Tech Stack Docs
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-sm font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'ai' ? 'text-white' : 'text-silver hover:text-white'
            }`}
            style={{
              borderBottom: activeTab === 'ai' ? '2px solid white' : '2px solid transparent',
              marginBottom: '-2px'
            }}
          >
            <Sparkles className="w-4 h-4" />
            Developing with AI
          </button>
        </div>

        {/* Tech Stack Cards (only show when tech-stack tab is active) */}
        {activeTab === 'tech-stack' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Select Your Tech Stack</h2>
              <button
                type="button"
                onClick={() => setTechStackSelectorCollapsed(!techStackSelectorCollapsed)}
                className="p-1 rounded transition-all text-silver hover:text-white"
              >
                {techStackSelectorCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {!techStackSelectorCollapsed && (
              <>
                {/* Backend */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-silver">Backend</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {techStacks.filter(s => s.category === 'backend').map((stack) => {
                      const Icon = stack.icon
                      return (
                        <button
                          key={stack.id}
                          onClick={(e) => {
                            e.preventDefault()
                            if (stack.available) {
                              setSelectedTechStack(stack.id)
                            }
                          }}
                          disabled={!stack.available}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedTechStack === stack.id 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-black/30 border-white/10 hover:bg-white/5'
                          }`}
                          style={{
                            opacity: stack.available ? 1 : 0.5,
                            cursor: stack.available ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Icon className="w-6 h-6 mb-2 text-white" />
                          <div className="text-sm font-medium text-white">
                            {stack.name}
                          </div>
                          {!stack.available && (
                            <div className="text-xs mt-1 text-silver">
                              Coming Soon
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Frontend */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-silver">Frontend</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {techStacks.filter(s => s.category === 'frontend').map((stack) => {
                      const Icon = stack.icon
                      return (
                        <button
                          key={stack.id}
                          onClick={(e) => {
                            e.preventDefault()
                            if (stack.available) {
                              setSelectedTechStack(stack.id)
                            }
                          }}
                          disabled={!stack.available}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedTechStack === stack.id 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-black/30 border-white/10 hover:bg-white/5'
                          }`}
                          style={{
                            opacity: stack.available ? 1 : 0.5,
                            cursor: stack.available ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Icon className="w-6 h-6 mb-2 text-white" />
                          <div className="text-sm font-medium text-white">
                            {stack.name}
                          </div>
                          {!stack.available && (
                            <div className="text-xs mt-1 text-silver">
                              Coming Soon
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-silver">Mobile</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {techStacks.filter(s => s.category === 'mobile').map((stack) => {
                      const Icon = stack.icon
                      return (
                        <button
                          key={stack.id}
                          onClick={(e) => {
                            e.preventDefault()
                            if (stack.available) {
                              setSelectedTechStack(stack.id)
                            }
                          }}
                          disabled={!stack.available}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedTechStack === stack.id 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-black/30 border-white/10 hover:bg-white/5'
                          }`}
                          style={{
                            opacity: stack.available ? 1 : 0.5,
                            cursor: stack.available ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Icon className="w-6 h-6 mb-2 text-white" />
                          <div className="text-sm font-medium text-white">
                            {stack.name}
                          </div>
                          {!stack.available && (
                            <div className="text-xs mt-1 text-silver">
                              Coming Soon
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Miscellaneous */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-silver">Miscellaneous</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {techStacks.filter(s => s.category === 'miscellaneous').map((stack) => {
                      const Icon = stack.icon
                      return (
                        <button
                          key={stack.id}
                          onClick={(e) => {
                            e.preventDefault()
                            if (stack.available) {
                              setSelectedTechStack(stack.id)
                            }
                          }}
                          disabled={!stack.available}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedTechStack === stack.id 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-black/30 border-white/10 hover:bg-white/5'
                          }`}
                          style={{
                            opacity: stack.available ? 1 : 0.5,
                            cursor: stack.available ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Icon className="w-6 h-6 mb-2 text-white" />
                          <div className="text-sm font-medium text-white">
                            {stack.name}
                          </div>
                          {!stack.available && (
                            <div className="text-xs mt-1 text-silver">
                              Coming Soon
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Documentation Content */}
        {activeTab === 'tech-stack' && selectedTechStack === 'nodejs' && (
          <div className="space-y-8">
            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Requirements</h2>
              </div>
              <div className="gradient-border p-4 sm:p-6">
                <ul className="space-y-2 text-silver">
                  <li>• Node.js v18.0.0 or later</li>
                  <li>• Support for environment variables (for securely storing credentials)</li>
                  <li>• An existing user authentication or session-validation flow</li>
                  <li>• Access to Unshared Labs Admin Dashboard</li>
                  <li>• Your Unshared Labs Client ID and API Key (contact support@unsharedlabs.com)</li>
                </ul>
              </div>
            </motion.div>

            {/* Installation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Installation</h2>
              </div>
              <p className="text-silver">Install the SDK using npm or yarn:</p>
              <CodeBlock code={codeBlocks.install} index={0} language="bash" />
            </motion.div>

            {/* Initializing the SDK */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Initializing the SDK</h2>
              </div>
              <p className="text-silver">Initialize the client with your Client ID and API Key:</p>
              <CodeBlock code={codeBlocks.quickStart} index={1} />
              <p className="text-sm text-silver mt-2">
                Once initialized, the client exposes core functions: <code className="text-white">processUserEvent()</code>, 
                <code className="text-white"> checkUser()</code>, <code className="text-white">triggerEmailVerification()</code>, and <code className="text-white">verify()</code>.
              </p>
            </motion.div>

            {/* processUserEvent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Sending Events: processUserEvent</h2>
              </div>
              <p className="text-silver">
                Use <code className="text-white">processUserEvent</code> during login, signup, or when users access protected/paywalled areas. 
                This function both records the user event and evaluates whether the user is currently flagged.
              </p>
              <CodeBlock code={codeBlocks.processUserEvent} index={2} />
              
              {/* Parameters Table */}
              <div className="gradient-border p-4 sm:p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Parameters</h3>
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
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-white/5 last:border-0">
                      <code className="text-sm text-white font-mono">{param.name}</code>
                      <span className="text-xs text-emerald-400 font-mono">{param.type}</span>
                      <span className="text-sm text-silver">{param.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-silver mt-4">Example usage:</p>
              <CodeBlock code={codeBlocks.processUserEventExample} index={3} />

              <p className="text-silver mt-4">Example response:</p>
              <CodeBlock code={codeBlocks.processUserEventResponse} index={4} language="json" />
              <p className="text-sm text-silver mt-2">
                The <code className="text-white">analysis.is_user_flagged</code> field indicates whether the user is currently flagged for suspected account sharing.
              </p>
            </motion.div>

            {/* checkUser */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Explicit User Checks: checkUser</h2>
              </div>
              <p className="text-silver">
                A lightweight alternative that allows you to explicitly check whether a user is flagged without recording an event.
              </p>
              <CodeBlock code={codeBlocks.checkUser} index={5} />
              <CodeBlock code={codeBlocks.checkUserExample} index={6} />
            </motion.div>

            {/* Handling Flagged Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Handling Flagged Users</h2>
              </div>
              <p className="text-silver">When <code className="text-white">is_user_flagged</code> returns <code className="text-white">true</code>, follow this flow:</p>
              <div className="gradient-border p-4 sm:p-6">
                <ol className="space-y-3 text-silver list-decimal list-inside">
                  <li>Present a verification prompt: Display your UI or modal informing the user that email verification is required.</li>
                  <li>Send the verification email: Call <code className="text-white">triggerEmailVerification()</code> as described below.</li>
                  <li>Collect the verification code: Prompt the user to enter the 6-digit code sent to their email.</li>
                  <li>Verify the code: Call <code className="text-white">verify()</code> to complete verification.</li>
                  <li>Resume the user flow: Upon successful verification, allow the user to proceed.</li>
                </ol>
              </div>
            </motion.div>

            {/* Email Verification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Email Verification</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Triggering Email Verification</h3>
                  <p className="text-silver mb-3">
                    Verification emails are not sent automatically. Your system must explicitly trigger them when a user requires verification.
                  </p>
                  <CodeBlock code={codeBlocks.triggerEmailVerification} index={7} />
                  <CodeBlock code={codeBlocks.triggerEmailExample} index={8} />
                  <p className="text-sm text-silver mt-2">
                    <strong>Note:</strong> Before using this functionality, you must complete email service setup including approval of a sender email address (see Admin Dashboard section below).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Verifying the User&apos;s Code</h3>
                  <p className="text-silver mb-3">After the user enters the 6-digit verification code:</p>
                  <CodeBlock code={codeBlocks.verify} index={9} />
                  <CodeBlock code={codeBlocks.verifyExample} index={10} />
                  <p className="text-sm text-silver mt-2">
                    If <code className="text-white">result.pass</code> is <code className="text-white">true</code>, verification succeeded. 
                    If <code className="text-white">false</code>, the code was incorrect or expired.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Email Sender Approval */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Email Sender Approval (Admin Dashboard)</h2>
              </div>
              <p className="text-silver">Before sending verification emails, you must approve a sender email address in the Unshared Labs Admin Dashboard. This setup is required once per client.</p>
              <div className="gradient-border p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Sender Approval Steps</h3>
                <ol className="space-y-2 text-silver list-decimal list-inside">
                  <li>Log in to the Unshared Labs Admin Dashboard</li>
                  <li>Navigate to Settings</li>
                  <li>Enter the sender details (Sender Name and Sender Email)</li>
                  <li>A 6-digit verification code will be sent to the provided sender email</li>
                  <li>Enter the verification code in the dashboard</li>
                  <li>Once verified, the sender email address will be marked as authenticated</li>
                </ol>
                <p className="text-sm text-silver mt-4">
                  <strong>Domain Authentication:</strong> After approving a sender email, you must authenticate your sending domain via DNS records. 
                  Contact <a href="mailto:support@unsharedlabs.com" className="text-white underline">support@unsharedlabs.com</a> to obtain the required DNS records.
                </p>
              </div>
            </motion.div>

            {/* Recommended Implementation Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Recommended Implementation Flow</h2>
              </div>
              <div className="gradient-border p-4 sm:p-6">
                <ol className="space-y-3 text-silver list-decimal list-inside">
                  <li>Install and initialize the SDK with your Client ID and API Key</li>
                  <li>Call <code className="text-white">processUserEvent</code> during login or other session-related actions</li>
                  <li>If <code className="text-white">is_user_flagged = true</code>:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Display your custom UI or modal informing the user that email verification is required</li>
                      <li>Trigger a verification email using <code className="text-white">triggerEmailVerification()</code></li>
                      <li>Collect the 6-digit code entered by the user</li>
                      <li>Call <code className="text-white">verify()</code> to complete the verification process</li>
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
            </motion.div>

            {/* Express Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white">Example: Express Server</h2>
              <p className="text-silver">Complete example of handling login events and flagged users in an Express.js application:</p>
              <CodeBlock code={codeBlocks.expressExample} index={11} />
            </motion.div>

            {/* Support Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="gradient-border p-6 sm:p-8 text-center"
            >
              <h2 className="text-xl font-bold text-white mb-2">Support</h2>
              <p className="text-silver mb-4">
                For any questions about the SDK, integration assistance, or to obtain your Client ID and API Key, please contact us.
              </p>
              <a 
                href="mailto:support@unsharedlabs.com"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all"
              >
                support@unsharedlabs.com
              </a>
            </motion.div>
          </div>
        )}

        {/* Developing with AI Tab */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-white">
                <strong>For AI Agents:</strong> Copy and paste the instructions below into your codebase or AI agent context to help it understand Unshared Labs and how to integrate it.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">AI Agent Instructions</h2>
              </div>
              <p className="text-silver">
                These markdown instructions provide context for AI coding assistants to understand Unshared Labs and help with integration.
              </p>
              <CodeBlock code={aiInstructions} index={100} language="markdown" />
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
