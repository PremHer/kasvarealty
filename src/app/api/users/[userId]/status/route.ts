import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // No permitir editar el propio registro
    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: 'No puedes editar tu propio registro' },
        { status: 403 }
      )
    }

    const userRole = session.user.role as Rol
    const canEditUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER'
    ].includes(userRole)

    if (!canEditUsers) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { isActive } = body

    const updatedUser = await prisma.usuario.update({
      where: { id: params.userId },
      data: { isActive }
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado del usuario' },
      { status: 500 }
    )
  }
} 