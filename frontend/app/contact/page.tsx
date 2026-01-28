'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Get message from URL params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const message = params.get('message')
      if (message) {
        setFormData(prev => ({ ...prev, message: decodeURIComponent(message) }))
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-silver mb-6">
              <Mail className="w-3.5 h-3.5" />
              Get in Touch
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-gradient-white">Let&apos;s talk</span>
              <br />
              <span className="text-gradient-silver">about your needs</span>
            </h1>
            <p className="text-silver text-lg sm:text-xl max-w-2xl mx-auto">
              Have questions? Want to start a free trial? We&apos;re here to help you protect your revenue and grow your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="relative pb-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="gradient-border p-8 sm:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-silver focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-silver focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-silver focus:outline-none focus:border-white/20 transition-colors resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm"
                >
                  Thank you! We&apos;ll get back to you soon.
                </motion.div>
              )}

              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm"
                >
                  Something went wrong. Please try again or email us directly at support@unsharedlabs.com
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary group flex items-center justify-center gap-2 px-6 py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Alternative Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-silver mb-4">Or reach us directly:</p>
            <a
              href="mailto:support@unsharedlabs.com"
              className="inline-flex items-center gap-2 text-white hover:text-silver transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@unsharedlabs.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xs sm:text-sm text-silver">
            © 2026 Unshared Labs. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
