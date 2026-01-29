import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/lib/auth-context'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Unshared Labs | Credential Sharing Detection for Course Creators',
  description: 'Stop password sharing and protect your revenue. Unshared Labs detects credential sharing for online course platforms, helping creators convert sharers into paying customers.',
  keywords: ['credential sharing', 'password sharing detection', 'online courses', 'revenue protection', 'course creators'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="noise-overlay" />
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
