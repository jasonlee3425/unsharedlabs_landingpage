'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Sparkles, Building2, ArrowRight, HeadphonesIcon, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans = [
    {
      name: 'Growth',
      tagline: 'For scaling teams',
      price: '$99',
      period: '/month',
      description: 'Up to 1,000 tracked users included',
      additionalInfo: '$0.10 per additional user',
      icon: Sparkles,
      featured: true,
      features: [
        'Account sharing detection',
        'Real-time monitoring dashboard',
        'Automated challenge system',
        'Device fingerprinting',
        'Session analytics',
        '5 team members',
        '30-day data retention',
        'Email & chat support',
        'Webhook integrations',
        'Custom challenge branding',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/contact?message=Hi!%20I%27d%20like%20to%20start%20a%20Free%20Trial%20please.',
    },
    {
      name: 'Enterprise',
      tagline: 'For large organizations',
      price: 'Custom',
      period: '',
      description: 'Volume-based pricing',
      additionalInfo: 'Annual contracts available',
      icon: Building2,
      featured: false,
      features: [
        'Everything in Growth',
        'Unlimited tracked users',
        'Dedicated account manager',
        'Custom integrations',
        'SSO & advanced security',
        'Unlimited team members',
        'Up to 18-month retention',
        'Priority phone support',
        'Custom SLA & contracts',
        'On-premise deployment option',
      ],
      cta: 'Contact Us',
      ctaLink: '/contact',
    },
  ]

  const faqs = [
    {
      question: 'What is a tracked user?',
      answer: 'A tracked user is any unique user whose session activity you monitor through our platform during a billing period. We count unique user IDs, not sessions or page views.',
    },
    {
      question: 'How quickly can I integrate Unshared Labs?',
      answer: 'Most teams complete integration within a few hours. Our SDK is designed to be as simple as adding an analytics snippet. If you need assistance, our team is available to help with the setup.',
    },
    {
      question: 'Will blocking account sharing hurt my user experience?',
      answer: "Our system is designed to be non-intrusive. We focus on egregious sharing patterns while allowing legitimate multi-device usage. The verification flow is optimized for conversion, encouraging sharers to create their own accounts rather than punishing them.",
    },
    {
      question: 'What ROI can I expect?',
      answer: 'Our customers typically see 3-10x return on investment. We track every conversion from detected sharers to paying users, so you can measure the exact impact on your revenue.',
    },
    {
      question: 'Can I customize the challenge flow?',
      answer: "Absolutely. You can customize the messaging, branding, and timing of challenges. Enterprise customers get additional options including custom domain challenges and A/B testing capabilities.",
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes! Growth plan customers get a 30-day free trial with full access to all features. No credit card required to start.',
    },
  ]

  return (
    <main className="relative min-h-screen pt-16">
      {/* Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-gradient-white">Invest in growth,</span>
              <br />
              <span className="text-gradient-silver">not lost revenue</span>
            </h1>
            <p className="text-silver text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Stop losing revenue to account sharing. Our customers typically see a minimum of a 4x ROI within the first month.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-silver">
              <BarChart3 className="w-4 h-4" />
              Simple, transparent pricing
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`relative rounded-2xl p-8 ${
                  plan.featured
                    ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-2 border-emerald-500/30'
                    : 'bg-white/[0.02] border border-white/10'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-8 px-3 py-1 bg-emerald-500 text-black text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.featured ? 'bg-emerald-500/20' : 'bg-white/5'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.featured ? 'text-emerald-400' : 'text-white'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-silver">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-silver">{plan.period}</span>
                  </div>
                  <p className="text-sm text-silver mt-2">{plan.description}</p>
                  <p className="text-xs text-emerald-400 mt-1">{plan.additionalInfo}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.featured ? 'text-emerald-400' : 'text-silver'
                      }`} />
                      <span className="text-sm text-silver">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all group ${
                    plan.featured
                      ? 'bg-white text-black hover:bg-off-white'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Enterprise highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 p-6 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <HeadphonesIcon className="w-8 h-8 text-emerald-400" />
              <div>
                <h4 className="font-semibold text-white">Need a custom solution?</h4>
                <p className="text-sm text-silver">Talk to our team about enterprise pricing and features.</p>
              </div>
            </div>
            <Link
              href="/contact"
              className="whitespace-nowrap px-5 py-2.5 rounded-lg bg-white/5 text-white text-sm font-medium border border-white/10 hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-silver">
              Everything you need to know about our platform and pricing.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-silver flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 text-silver text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative pb-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="gradient-border p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to recover lost revenue?
            </h2>
            <p className="text-silver mb-8 max-w-xl mx-auto">
              Join companies that have already recovered millions in revenue from account sharing. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact?message=Hi!%20I%27d%20like%20to%20start%20a%20Free%20Trial%20please."
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-off-white transition-all group"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
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
