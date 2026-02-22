import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { QueryProvider } from '@/lib/query-client'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineBanner } from '@/components/pwa/OfflineBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KAVACH AI — Student Monitoring',
  description: 'Monitor your child\'s digital wellbeing. Block apps, set goals, track focus.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KAVACH AI',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'KAVACH AI',
    description: 'Student monitoring & digital wellbeing for Indian schools',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-144x144.png', sizes: '144x144' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563EB',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)',  color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineBanner />
        <ErrorBoundary>
        <AuthProvider>
          <QueryProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
          </QueryProvider>
        </AuthProvider>
        </ErrorBoundary>
        <InstallPrompt />
      </body>
    </html>
  )
}
