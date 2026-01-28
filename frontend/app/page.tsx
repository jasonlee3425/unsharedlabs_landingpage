'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield,
  Eye, 
  TrendingUp, 
  Users, 
  Zap, 
  Lock,
  ChevronDown,
  ArrowRight,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  BarChart3,
  Code2,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import DemoModal from '@/components/DemoModal'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function Home() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  return (
    <main className="relative overflow-hidden pt-16">
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-start pt-20 grid-pattern">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 pb-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm text-silver"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Now monitoring thousands of accounts
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="text-gradient-white">Convert Account Sharers.</span>
              <br />
              <span className="text-gradient-silver">Grow Revenue.</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-silver leading-relaxed px-4 sm:px-0">
              Automatically detect account sharing and convert freeloaders into paying customers without disrupting your user experience.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-8 px-4 sm:px-0">
              <Link href="/signup" className="w-full sm:w-auto btn-primary group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base font-medium text-white border border-white/20 rounded-xl hover:bg-white/5 transition-all">
                <Code2 className="w-4 h-4" />
                View Documentation
              </Link>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.a
            href="#stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:block cursor-pointer hover:text-white transition-colors"
          >
            <ChevronDown className="w-6 h-6 text-silver animate-bounce" />
          </motion.a>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-16 sm:py-24 border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-6 sm:gap-8"
          >
            {[
              { value: '99%', label: 'Detection Accuracy' },
              { value: '3.2x', label: 'Revenue Recovery' },
              { value: '<50ms', label: 'API Latency' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-white mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-silver">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-16 sm:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gradient-silver mb-3 sm:mb-4">
              Password sharing is costing you
            </h2>
            <p className="max-w-2xl mx-auto text-silver text-sm sm:text-base px-4 sm:px-0">
              Password sharing is extremely common.
              <br />
              That&apos;s revenue you&apos;ve already earned walking out the door.
            </p>
          </motion.div>

          {/* Visual Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="gradient-border p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Account Card */}
                <div className="bg-black/50 rounded-xl p-4 sm:p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-sm text-silver">Account Insights</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-silver">Shared by</span>
                      <span className="text-white font-medium">5+ people</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-silver">Devices</span>
                      <span className="text-white font-medium">12 unique</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-silver">Locations</span>
                      <span className="text-white font-medium">8 cities</span>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-white/5">
                      <span className="text-xs text-silver">Sharing signals</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 text-xs bg-rose-500/20 text-rose-400 rounded-full">Concurrent 23</span>
                        <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full">Travel 8</span>
                        <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">Devices 12</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Devices List */}
                <div className="bg-black/50 rounded-xl p-4 sm:p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-sm text-silver">User Devices</span>
                    <span className="text-xs text-silver">Status</span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { icon: Monitor, id: '8f2a91c...', status: 'owner', color: 'emerald' },
                      { icon: Smartphone, id: '3b7e42d...', status: 'flagged', color: 'amber' },
                      { icon: Monitor, id: '9c1f83a...', status: 'flagged', color: 'amber' },
                      { icon: Smartphone, id: '5d4a92e...', status: 'blocked', color: 'rose' },
                      { icon: Globe, id: '2e8b71f...', status: 'blocked', color: 'rose' },
                    ].map((device, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 sm:py-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <device.icon className="w-4 h-4 text-silver" />
                          <span className="font-mono text-xs sm:text-sm text-silver">{device.id}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-${device.color}-500/20 text-${device.color}-400`}>
                          {device.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Impact */}
                <div className="bg-black/50 rounded-xl p-4 sm:p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <span className="text-sm text-silver">Revenue Impact</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">$120,847</div>
                      <div className="text-xs text-emerald-400">+23% recovered this month</div>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-white/5 space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-silver">Sharers converted</span>
                        <span className="text-white font-medium">1,421</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-silver">Accounts secured</span>
                        <span className="text-white font-medium">5,240</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-silver">Conversion rate</span>
                        <span className="text-white font-medium">67%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative py-16 sm:py-24 border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Interactive Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-16 sm:mb-20 text-center"
          >
            <div className="inline-flex flex-col items-center gap-4 sm:gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  See this in action
                </h3>
                <p className="text-silver text-sm sm:text-base max-w-md">
                  Experience how Unshared Labs detects account sharers and guides them through verification
                </p>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="btn-primary group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all"
              >
                Try Interactive Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div
            id="setup-in-minutes"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16 scroll-mt-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-white">Quick</span>
              {' '}
              <span className="text-gradient-silver">Setup</span>
            </h2>
            <p className="max-w-2xl mx-auto text-silver text-base sm:text-lg px-4 sm:px-0">
              With our lightweight SDK, get real-time detection and start protecting your revenue.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Steps */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6 order-1 lg:order-1"
            >
              {[
                {
                  step: '01',
                  title: 'Install the SDK',
                  description: 'Add our SDK to your platform. Through the SDK, with time our system learns user behaviors.',
                },
                {
                  step: '02',
                  title: 'Set up prevention measures',
                  description: 'Configure account verification flows and prevention measures to protect your revenue.',
                },
                {
                  step: '03',
                  title: 'Deploy & monitor',
                  description: 'Go live and watch your dashboard populate with insights and recovered revenue.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="flex gap-4 sm:gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <span className="text-xs sm:text-sm font-mono text-silver">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-silver text-sm">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Visual Diagram */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="gradient-border p-6 sm:p-8 order-2 lg:order-2"
            >
              <div className="space-y-6">
                {/* Step 1: Install the SDK */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">Install the SDK</div>
                    <div className="text-xs text-silver">SDK installed, learning user behaviors over time</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-px h-8 bg-gradient-to-b from-white/20 to-white/5" />
                </div>

                {/* Step 2: Set up Prevention Measures */}
                <div className="gradient-border p-4 bg-black/30">
                  <div className="text-sm font-medium text-white mb-3">Set up Prevention Measures</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white">Account verification flows</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white">Revenue protection enabled</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-px h-8 bg-gradient-to-b from-white/20 to-white/5" />
                </div>

                {/* Step 3: Deploy & Monitor */}
                <div className="gradient-border p-4 bg-black/30">
                  <div className="text-sm font-medium text-white mb-3">Deploy & Monitor</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white">Legitimate user verified</span>
                      </div>
                      <span className="text-xs text-silver">just now</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-white">Sharing detected → Challenge sent</span>
                      </div>
                      <span className="text-xs text-silver">2m ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white">Sharer converted to paid user</span>
                      </div>
                      <span className="text-xs text-silver">5m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 sm:py-24 border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-white">Enterprise-grade</span>
              {' '}
              <span className="text-gradient-silver">detection</span>
            </h2>
            <p className="max-w-2xl mx-auto text-silver text-base sm:text-lg px-4 sm:px-0">
              Built specifically for online course creators. Our platform identifies 
              credential sharing while converting sharers into paying customers.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {[
              {
                icon: Eye,
                title: 'Device Intelligence',
                description: 'Track device fingerprints, IP addresses, and user agents to build comprehensive user profiles.',
              },
              {
                icon: Zap,
                title: 'Real-time Detection',
                description: 'Identify concurrent sessions, impossible travel, and suspicious patterns as they happen.',
              },
              {
                icon: Users,
                title: 'Smart Conversion',
                description: 'Convert password sharers into paying customers with customizable challenge flows.',
              },
              {
                icon: Lock,
                title: 'Seamless Security',
                description: 'Protect your content without disrupting legitimate users. Netflix-style approach.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Comprehensive insights into sharing patterns, revenue impact, and conversion metrics.',
              },
              {
                icon: Code2,
                title: 'Developer First',
                description: 'Simple SDK integration with hooks, callbacks, and pre-built UI components.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group gradient-border p-5 sm:p-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/10 transition-colors">
                  <feature.icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-silver text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="relative py-16 sm:py-24 border-t border-white/5 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="gradient-border p-8 sm:p-12 md:p-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-white">Ready to grow</span>
              <br />
              <span className="text-gradient-silver">your revenue?</span>
            </h2>
            <p className="max-w-xl mx-auto text-silver text-base sm:text-lg mb-6 sm:mb-8">
              Join hundreds of online platforms who&apos;ve stopped credential sharing 
              and increased their revenue. It&apos;s completely free to start.
            </p>
            <Link href="/signup" className="btn-primary group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 sm:py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Unshared Labs</span>
            </div>
            
            <div className="text-xs sm:text-sm text-silver">
              © 2026 Unshared Labs. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
