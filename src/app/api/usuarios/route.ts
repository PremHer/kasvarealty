import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Rol } from '@prisma/client'

// Definir roles permitidos para ver usuarios
const USER_VIEW_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'FINANCE_MANAGER'
]

// GET /api/usuarios - Obtener todos los usuarios activos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver usuarios
    if (!USER_VIEW_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver usuarios' }, { status: 403 })
    }

    // Obtener todos los usuarios activos
    const usuarios = await prisma.usuario.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      usuarios,
      total: usuarios.length
    })

  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'No autorizado' }),
        { status: 401 }
      )
    }

    // Obtener el usuario actual
    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ message: 'No autorizado' }),
        { status: 401 }
      )
    }

    // Verificar si el usuario tiene permiso para crear usuarios
    const canCreateUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER'
    ].includes(currentUser.rol)

    if (!canCreateUsers) {
      return new NextResponse(
        JSON.stringify({ message: 'No tiene permisos para crear usuarios' }),
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nombre, email, password, rol } = body

    // Validar que el email no esté en uso
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ message: 'El email ya está en uso' }),
        { status: 400 }
      )
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
        isActive: true
      }
    })

    return new NextResponse(
      JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        isActive: usuario.isActive
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error al crear usuario' }),
      { status: 500 }
    )
  }
} 