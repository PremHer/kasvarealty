'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UsersTable from '@/components/users/users-table'
import type { Rol } from '@prisma/client'

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUserCreated = () => {
    fetchUsers()
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }

  const canCreateUsers = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_MANAGER'
  ].includes(session?.user?.role as Rol)

  const canManageEmpresas = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL'
  ].includes(session?.user?.role as Rol)

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      <UsersTable 
        users={users} 
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
} 