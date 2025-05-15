import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Solo permitir acceso a gerentes generales
    if (session.user.role !== 'GERENTE_GENERAL') {
      return new NextResponse('No autorizado', { status: 403 })
    }

    // Obtener todos los project managers registrados
    const projectManagers = await prisma.usuario.findMany({
      where: {
        rol: 'PROJECT_MANAGER'
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        empresaDesarrolladora: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    const managers = projectManagers.map(manager => ({
      id: manager.id,
      name: manager.nombre,
      email: manager.email,
      company: manager.empresaDesarrolladora ? {
        id: manager.empresaDesarrolladora.id,
        name: manager.empresaDesarrolladora.nombre
      } : null
    }))

    return NextResponse.json(managers)
  } catch (error) {
    console.error('Error al obtener project managers:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 