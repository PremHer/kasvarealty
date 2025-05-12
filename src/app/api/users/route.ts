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

// GET /api/users - Listar usuarios
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Verificar permisos para ver la lista de usuarios
    const canViewUsers = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL'].includes(currentUser.rol)
    if (!canViewUsers) {
      return new NextResponse('No autorizado', { status: 403 })
    }

    const users = await prisma.usuario.findMany({
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

    return NextResponse.json(users.map(user => ({
      id: user.id,
      name: user.nombre,
      email: user.email,
      rol: user.rol,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    })))
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

// POST /api/users - Crear usuario
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el usuario actual
    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    // Validar datos
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Definir roles permitidos según el rol del usuario actual
    const allowedRoles = (() => {
      switch (currentUser.rol) {
        case 'SUPER_ADMIN':
          return ALL_ROLES // SUPER_ADMIN puede asignar cualquier rol
        case 'ADMIN':
          return ALL_ROLES.filter(role => role !== 'SUPER_ADMIN') // ADMIN puede asignar cualquier rol excepto SUPER_ADMIN
        case 'GERENTE_GENERAL':
          return ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'INVESTOR', 'GUEST']
        case 'SALES_MANAGER':
          return ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR']
        case 'PROJECT_MANAGER':
          return ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT']
        case 'FINANCE_MANAGER':
          return ['ACCOUNTANT', 'FINANCE_ASSISTANT']
        default:
          return []
      }
    })()

    // Verificar si el rol solicitado está permitido
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'No autorizado para asignar este rol' }, { status: 403 })
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        nombre: name,
        email,
        password: hashedPassword,
        rol: role,
        createdBy: currentUser.id
      }
    })

    return NextResponse.json({
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos para eliminar usuarios
    const canDeleteUsers = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.rol)
    if (!canDeleteUsers) {
      return NextResponse.json({ error: 'No autorizado para eliminar usuarios' }, { status: 403 })
    }

    const { id } = params

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 