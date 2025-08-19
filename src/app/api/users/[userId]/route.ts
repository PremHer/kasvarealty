import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import type { Rol } from '@prisma/client'

// GET /api/users/[userId] - Obtener detalles del usuario
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    const canViewUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER',
      'SALES_REP',
      'SALES_ASSISTANT',
      'SALES_COORDINATOR',
      'PROJECT_ASSISTANT',
      'ACCOUNTANT',
      'FINANCE_ASSISTANT'
    ].includes(userRole)

    if (!canViewUsers) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener el usuario con todos sus campos
    const user = await prisma.usuario.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        dni: true,
        sexo: true,
        fechaNacimiento: true,
        estadoCivil: true,
        profesion: true,
        direccion: true,
        distrito: true,
        provincia: true,
        departamento: true,
        empresaDesarrolladoraId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

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
    const { 
      nombre, 
      email, 
      rol,
      // Nuevos campos
      dni,
      sexo,
      fechaNacimiento,
      estadoCivil,
      profesion,
      direccion,
      distrito,
      provincia,
      departamento
    } = body

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
          { 
            error: 'El correo electrónico ya está registrado en el sistema',
            code: 'EMAIL_DUPLICATE'
          },
          { status: 400 }
        )
      }
    }

    // Permitir actualización de otros campos incluso si tiene proyectos asociados
    // Solo se bloquea el cambio de rol, no la actualización de información personal

    // RESTRICCIÓN: Solo bloquear cambio de rol si el usuario tiene proyectos asociados como gerente, creador o aprobador
    if (rol !== userToUpdate.rol) {
      const proyectosAsociados = await prisma.proyecto.findFirst({
        where: {
          OR: [
            { gerenteId: params.userId },
            { creadoPorId: params.userId },
            { aprobadoPorId: params.userId }
          ]
        }
      })
      if (proyectosAsociados) {
        return NextResponse.json(
          {
            error: 'No se puede cambiar el rol de un usuario que tiene proyectos asociados (como gerente, creador o aprobador).',
            code: 'USER_HAS_PROJECTS'
          },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    try {
      const updatedUser = await prisma.usuario.update({
        where: { id: params.userId },
        data: {
          nombre,
          email,
          rol,
          // Nuevos campos
          dni: dni || null,
          sexo: sexo || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          estadoCivil: estadoCivil || null,
          profesion: profesion || null,
          direccion: direccion || null,
          distrito: distrito || null,
          provincia: provincia || null,
          departamento: departamento || null
        }
      })

      // No devolver la contraseña en la respuesta
      const { password: _, ...userWithoutPassword } = updatedUser
      return NextResponse.json(userWithoutPassword)
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error)
      
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          return NextResponse.json(
            { 
              error: 'El correo electrónico ya está registrado en el sistema',
              code: 'EMAIL_DUPLICATE'
            },
            { status: 400 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      )
    }
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

    // Verificar proyectos asociados antes de eliminar el usuario
    const projects = await prisma.proyecto.findMany({
      where: {
        OR: [
          {
            gerenteId: params.userId
          },
          {
            creadoPorId: params.userId
          },
          {
            aprobadoPorId: params.userId
          },
          {
            miembros: {
              some: {
                id: params.userId
              }
            }
          }
        ]
      }
    })

    if (projects.length > 0) {
      return NextResponse.json(
        { error: 'No puedes eliminar este usuario porque tiene proyectos asociados' },
        { status: 403 }
      )
    }

    // RESTRICCIÓN: No permitir eliminar si el usuario tiene proyectos asociados como gerente, creador o aprobador
    const proyectosAsociados = await prisma.proyecto.findFirst({
      where: {
        OR: [
          { gerenteId: params.userId },
          { creadoPorId: params.userId },
          { aprobadoPorId: params.userId }
        ]
      }
    })
    if (proyectosAsociados) {
      return NextResponse.json(
        { error: 'No puedes eliminar este usuario porque tiene proyectos asociados (como gerente, creador o aprobador).' },
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