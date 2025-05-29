import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo los roles autorizados pueden ver la lista de project managers
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL'].includes(usuario.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const projectManagers = await prisma.usuario.findMany({
      where: {
        rol: 'PROJECT_MANAGER',
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        email: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(projectManagers)
  } catch (error) {
    console.error('Error al obtener project managers:', error)
    return NextResponse.json(
      { error: 'Error al obtener project managers' },
      { status: 500 }
    )
  }
} 