import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Rol } from '@prisma/client'

// Definir todos los roles disponibles
const ALL_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'DEVELOPER',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'SALES_COORDINATOR',
  'PROJECT_MANAGER',
  'CONSTRUCTION_SUPERVISOR',
  'QUALITY_CONTROL',
  'PROJECT_ASSISTANT',
  'FINANCE_MANAGER',
  'ACCOUNTANT',
  'FINANCE_ASSISTANT',
  'INVESTOR',
  'GUEST'
]

// Definir la jerarquía de roles
const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
  SUPER_ADMIN: ALL_ROLES,
  ADMIN: ALL_ROLES.filter(role => role !== 'SUPER_ADMIN'),
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

// GET /api/users - Listar usuarios
export async function GET(request: Request) {
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
      'FINANCE_MANAGER'
    ].includes(userRole)

    if (!canViewUsers) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const rolFilter = searchParams.get('rol')

    // Obtener los roles permitidos según la jerarquía
    const allowedRoles = ROLE_HIERARCHY[userRole] || []

    // Construir la condición where para filtrar usuarios
    let where: any = userRole === 'SUPER_ADMIN' 
      ? {} // SUPER_ADMIN puede ver todos los usuarios
      : {
          rol: {
            in: allowedRoles
          }
        }

    // Aplicar filtro por rol si se especifica
    if (rolFilter) {
      // Verificar que el rol solicitado está permitido
      if (!allowedRoles.includes(rolFilter as Rol) && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'No autorizado para ver usuarios con este rol' }, { status: 403 })
      }
      
      where = {
        ...where,
        rol: rolFilter
      }
    }

    const users = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        lastLogin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST /api/users - Crear usuario
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    const canCreateUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER'
    ].includes(userRole)

    if (!canCreateUsers) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, email, password, rol } = body

    // Verificar que el rol que se está asignando está permitido según la jerarquía
    const allowedRoles = ROLE_HIERARCHY[userRole] || []
    if (!allowedRoles.includes(rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para asignar este rol' },
        { status: 403 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'El email ya está registrado',
          details: 'Por favor, utilice un email diferente o contacte al administrador si necesita recuperar el acceso a esta cuenta.'
        },
        { status: 400 }
      )
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol
      }
    })

    // No devolver la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear usuario',
        details: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente o contacte al administrador del sistema.'
      },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
    const { nombre, email, rol } = body

    // Verificar que el rol que se está asignando está permitido según la jerarquía
    const allowedRoles = ROLE_HIERARCHY[userRole] || []
    if (!allowedRoles.includes(rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para asignar este rol' },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        nombre,
        email,
        rol
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

    // Obtener el usuario que se va a eliminar para verificar su rol
    const userToDelete = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { rol: true }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario que se está eliminando tiene un rol permitido según la jerarquía
    const allowedRoles = ROLE_HIERARCHY[userRole] || []
    if (!allowedRoles.includes(userToDelete.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este usuario' },
        { status: 403 }
      )
    }

    await prisma.usuario.delete({
      where: { id: params.id }
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