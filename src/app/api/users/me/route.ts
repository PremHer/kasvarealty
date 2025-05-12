import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { email: session.user?.email! },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true
      }
    })

    if (!user) {
      return new NextResponse('Usuario no encontrado', { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 