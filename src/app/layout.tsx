import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from '@/components/ui/use-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KASVA Realty',
  description: 'Sistema integral para gestión de proyectos inmobiliarios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toaster position="bottom-right" />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 