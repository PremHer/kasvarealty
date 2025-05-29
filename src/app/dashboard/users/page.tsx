'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UsersTable from '@/components/users/users-table'
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from '@/components/ui/button'
import { FiPlus } from 'react-icons/fi'
import type { Rol } from '@prisma/client'
import NewUserModal from '@/components/users/new-user-modal'

interface SessionUser {
  role?: string
}

interface Session {
  user?: SessionUser
}

export default function UsersPage() {
  const { data: session } = useSession() as { data: Session | null }
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario tiene permiso para ver usuarios
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER']
    if (!allowedRoles.includes(session.user.role || '')) {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserCreated = async () => {
    await fetchUsers() // Asegurarse de que se actualice la lista de usuarios
    setIsNewModalOpen(false)
  }

  const handleUserUpdated = async () => {
    await fetchUsers() // Asegurarse de que se actualice la lista de usuarios
  }

  const handleCloseModal = () => {
    setIsNewModalOpen(false)
  }

  const canCreateUsers = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_MANAGER'
  ].includes(session?.user?.role as Rol)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Usuarios", href: "/dashboard/users" }
            ]}
            className="mt-2"
          />
        </div>
        {canCreateUsers && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <UsersTable 
        users={users} 
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />

      <NewUserModal
        isOpen={isNewModalOpen}
        onClose={handleCloseModal}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
} 