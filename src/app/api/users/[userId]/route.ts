import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// PUT /api/users/[userId] - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Obtener el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return new NextResponse('Usuario no encontrado', { status: 404 })
    }

    // Obtener el usuario a actualizar
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!userToUpdate) {
      return new NextResponse('Usuario no encontrado', { status: 404 })
    }

    const body = await request.json()
    const { name, email, role } = body

    // Validar datos
    if (!name || !email || !role) {
      return new NextResponse('Faltan datos requeridos', { status: 400 })
    }

    // Verificar permisos para editar
    const canEdit = (() => {
      if (currentUser.role === 'SUPER_ADMIN') return true
      if (currentUser.role === 'ADMIN') return userToUpdate.role !== 'SUPER_ADMIN'
      
      // Permisos para gerentes
      if (currentUser.role === 'SALES_MANAGER') {
        return ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'].includes(userToUpdate.role)
      }
      if (currentUser.role === 'PROJECT_MANAGER') {
        return ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'].includes(userToUpdate.role)
      }
      if (currentUser.role === 'FINANCE_MANAGER') {
        return ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'].includes(userToUpdate.role)
      }
      return false
    })()

    if (!canEdit) {
      return new NextResponse('No autorizado para editar este usuario', { status: 403 })
    }

    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email !== userToUpdate.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return new NextResponse('El email ya está registrado', { status: 400 })
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name,
        email,
        role
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

// DELETE /api/users/[userId] - Eliminar usuario
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Obtener el usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return new NextResponse('Usuario no encontrado', { status: 404 })
    }

    // Obtener el usuario a eliminar
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!userToDelete) {
      return new NextResponse('Usuario no encontrado', { status: 404 })
    }

    // Verificar permisos para eliminar
    const canDelete = (() => {
      // SUPER_ADMIN puede eliminar a cualquiera excepto a sí mismo
      if (currentUser.role === 'SUPER_ADMIN') {
        return userToDelete.id !== currentUser.id
      }

      // ADMIN puede eliminar a cualquiera excepto SUPER_ADMIN, ADMIN y a sí mismo
      if (currentUser.role === 'ADMIN') {
        return userToDelete.role !== 'SUPER_ADMIN' && 
               userToDelete.role !== 'ADMIN' && 
               userToDelete.id !== currentUser.id
      }

      // Los gerentes solo pueden eliminar usuarios de su área
      if (currentUser.role === 'SALES_MANAGER') {
        return ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'].includes(userToDelete.role)
      }

      if (currentUser.role === 'PROJECT_MANAGER') {
        return ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'].includes(userToDelete.role)
      }

      if (currentUser.role === 'FINANCE_MANAGER') {
        return ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'].includes(userToDelete.role)
      }

      return false
    })()

    if (!canDelete) {
      return new NextResponse('No autorizado para eliminar este usuario', { status: 403 })
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: params.userId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 