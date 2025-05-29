import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoProyecto } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo permitir acceso a gerentes generales
    if (session.user.role !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { managerId } = body

    if (!managerId) {
      return NextResponse.json({ error: 'ID del gerente es requerido' }, { status: 400 })
    }

    // Verificar que el proyecto existe y está en un estado válido para asignación
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    if (proyecto.estado !== EstadoProyecto.PENDING_ASSIGNMENT && proyecto.estado !== EstadoProyecto.APPROVED) {
      return NextResponse.json({ error: 'El proyecto no está en un estado válido para asignación' }, { status: 400 })
    }

    // Verificar que el gerente existe y tiene el rol correcto
    const gerente = await prisma.usuario.findUnique({
      where: { id: managerId }
    })

    if (!gerente) {
      return NextResponse.json({ error: 'Gerente no encontrado' }, { status: 404 })
    }

    if (gerente.rol !== 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'El usuario seleccionado no es un project manager' }, { status: 400 })
    }

    // Actualizar el proyecto
    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        gerenteId: managerId,
        estado: EstadoProyecto.APPROVED,
        aprobadoPorId: session.user.id,
        fechaAprobacion: new Date()
      },
      include: {
        gerente: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    if (!proyectoActualizado.gerente) {
      return NextResponse.json({ error: 'Error al asignar gerente' }, { status: 500 })
    }

    return NextResponse.json({
      id: proyectoActualizado.id,
      manager: {
        id: proyectoActualizado.gerente.id,
        name: proyectoActualizado.gerente.nombre,
        email: proyectoActualizado.gerente.email
      }
    })
  } catch (error) {
    console.error('Error al asignar gerente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 