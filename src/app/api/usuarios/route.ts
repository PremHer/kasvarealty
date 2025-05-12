import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
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

    // Verificar si el usuario tiene permiso para ver usuarios
    const canViewUsers = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL'
    ].includes(currentUser.rol)

    if (!canViewUsers) {
      return new NextResponse(
        JSON.stringify({ message: 'No tiene permisos para ver usuarios' }),
        { status: 403 }
      )
    }

    // Obtener el parámetro de rol de la URL
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get('rol')

    // Construir el where clause
    const where = rol ? { rol: rol as any } : {}

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return new NextResponse(
      JSON.stringify(usuarios),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error al obtener usuarios' }),
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