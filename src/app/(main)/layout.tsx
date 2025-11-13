import React from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col rtl">
      <React.Suspense fallback={null}>
        <Header />
      </React.Suspense>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

