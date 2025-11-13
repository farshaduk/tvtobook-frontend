import type { Metadata } from 'next'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { LoadingProvider } from '@/providers/LoadingProvider'
import { ConfirmationProvider } from '@/hooks/useConfirmationMo'
import { ToastProvider } from '../components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { SessionWarning } from '@/components/SessionWarning'
import './globals.css'

export const metadata: Metadata = {
  title: 'TvToBook',
  description: 'A modern React application with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <QueryProvider>
          <ThemeProvider>
            <LoadingProvider>
              <AuthProvider>
                <SessionWarning />
                <ConfirmationProvider isRtl={true}>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </ConfirmationProvider>
              </AuthProvider>
            </LoadingProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
