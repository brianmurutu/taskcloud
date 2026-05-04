import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaskCloud — Digital Task Marketplace',
  description: 'Earn by completing tasks or hire skilled people to get things done. Secure payments in KES & USD via Paystack.',
  keywords: 'task marketplace Kenya, earn online Kenya, freelance tasks, online work Kenya',
  openGraph: {
    title: 'TaskCloud — Digital Task Marketplace',
    description: 'Connect with skilled taskers or find work that fits your skills.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.paystack.co/v1/inline.js" async />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111916',
                color: '#e8f0e8',
                border: '1px solid #1e2b1e',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#0a0f0d' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#0a0f0d' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
