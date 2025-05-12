import { useState } from 'react'

interface Toast {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (toastData: Toast) => {
    setToast(toastData)
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  return {
    toast: showToast,
    currentToast: toast
  }
} 