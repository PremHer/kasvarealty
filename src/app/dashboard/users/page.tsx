import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UsersTable from '@/components/users/users-table'
import type { Rol } from '@prisma/client'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  // Obtener el usuario actual
  const currentUser = await prisma.usuario.findUnique({
    where: { email: session.user.email }
  })

  if (!currentUser) {
    redirect('/login')
  }

  // Verificar si el usuario tiene permiso para ver usuarios
  const canViewUsers = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL'
  ].includes(currentUser.rol)

  if (!canViewUsers) {
    redirect('/dashboard')
  }

  // Obtener la lista de usuarios
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      isActive: true,
      lastLogin: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      <UsersTable 
        users={usuarios} 
        currentUserRole={currentUser.rol}
      />
    </div>
  )
} 