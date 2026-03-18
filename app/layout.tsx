import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/notifications/ToastProvider'
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider'
import { LocalToastProvider } from '@/components/ui/Toast/Toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Lookatfy | Marketplace for Experts',
  description: 'Connect with experts via video calls instantly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <LocalToastProvider>
          <NotificationsProvider>
            {children}
            <ToastProvider />
          </NotificationsProvider>
        </LocalToastProvider>
      </body>
    </html>
  )
}
