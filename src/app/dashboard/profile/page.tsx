'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import ProfileCard from '@/components/profile/profile-card'

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-8">
      <ProfileCard />
    </div>
  )
} 