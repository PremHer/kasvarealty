'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProviderProps } from './types'
import { useEffect, useState } from 'react'

export function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <SessionProvider>{children}</SessionProvider>
} 