import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { isActive } = await request.json()

    // Verificar que el usuario que hace la petición tiene permisos
    const currentUser = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const targetUser = await prisma.usuario.findUnique({
      where: { id: params.userId },
      select: { rol: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir desactivar el propio usuario
    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 403 }
      )
    }

    // Actualizar el estado del usuario
    const updatedUser = await prisma.usuario.update({
      where: { id: params.userId },
      data: { isActive },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado del usuario' },
      { status: 500 }
    )
  }
} 