import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

// PUT /api/users/[userId] - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

    // Obtener el usuario a actualizar
    const userToUpdate = await prisma.usuario.findUnique({
      where: { id: params.userId }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { nombre, email, rol } = body

    // Verificar que el rol que se está asignando está permitido según la jerarquía
    const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
      SUPER_ADMIN: ['ADMIN', 'GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
      ADMIN: ['GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
      GERENTE_GENERAL: ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'INVESTOR', 'GUEST'],
      SALES_MANAGER: ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'],
      PROJECT_MANAGER: ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'],
      FINANCE_MANAGER: ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'GUEST'],
      DEVELOPER: ['GUEST'],
      SALES_REP: ['GUEST'],
      SALES_ASSISTANT: ['GUEST'],
      SALES_COORDINATOR: ['GUEST'],
      CONSTRUCTION_SUPERVISOR: ['GUEST'],
      QUALITY_CONTROL: ['GUEST'],
      PROJECT_ASSISTANT: ['GUEST'],
      ACCOUNTANT: ['GUEST'],
      FINANCE_ASSISTANT: ['GUEST'],
      INVESTOR: ['GUEST'],
      GUEST: []
    }

    const allowedRoles = ROLE_HIERARCHY[userRole] || []
    if (!allowedRoles.includes(rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para asignar este rol' },
        { status: 403 }
      )
    }

    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email !== userToUpdate.email) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.usuario.update({
      where: { id: params.userId },
      data: {
        nombre,
        email,
        rol
      }
    })

    // No devolver la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[userId] - Eliminar usuario
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // No permitir eliminar el propio registro
    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio registro' },
        { status: 403 }
      )
    }

    const userRole = session.user.role as Rol
    const canDeleteUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER'
    ].includes(userRole)

    if (!canDeleteUsers) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener el usuario a eliminar
    const userToDelete = await prisma.usuario.findUnique({
      where: { id: params.userId }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario que se está eliminando tiene un rol permitido según la jerarquía
    const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
      SUPER_ADMIN: ['ADMIN', 'GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
      ADMIN: ['GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
      GERENTE_GENERAL: ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'INVESTOR', 'GUEST'],
      SALES_MANAGER: ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'],
      PROJECT_MANAGER: ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'],
      FINANCE_MANAGER: ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'GUEST'],
      DEVELOPER: ['GUEST'],
      SALES_REP: ['GUEST'],
      SALES_ASSISTANT: ['GUEST'],
      SALES_COORDINATOR: ['GUEST'],
      CONSTRUCTION_SUPERVISOR: ['GUEST'],
      QUALITY_CONTROL: ['GUEST'],
      PROJECT_ASSISTANT: ['GUEST'],
      ACCOUNTANT: ['GUEST'],
      FINANCE_ASSISTANT: ['GUEST'],
      INVESTOR: ['GUEST'],
      GUEST: []
    }

    const allowedRoles = ROLE_HIERARCHY[userRole] || []
    if (!allowedRoles.includes(userToDelete.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este usuario' },
        { status: 403 }
      )
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: params.userId }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
} 