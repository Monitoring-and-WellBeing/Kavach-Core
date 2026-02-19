import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { QueryProvider } from '@/lib/query-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KAVACH AI',
  description: 'Student Safety & Digital Wellbeing Platform',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
