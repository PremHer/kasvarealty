import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo los gerentes generales pueden rechazar proyectos
    if (usuario.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que el proyecto existe y pertenece a una empresa donde el usuario es representante legal
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        id: params.id,
        estado: {
          in: ['PENDING_APPROVAL', 'PENDING_ASSIGNMENT']
        },
        empresaDesarrolladora: {
          representanteLegalId: usuario.id
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado o no tienes permiso para rechazarlo' },
        { status: 404 }
      )
    }

    // Obtener el motivo del rechazo del body
    const { reason } = await request.json()
    if (!reason) {
      return NextResponse.json(
        { error: 'Se requiere un motivo para rechazar el proyecto' },
        { status: 400 }
      )
    }

    // Actualizar el estado del proyecto a REJECTED
    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        estado: 'REJECTED',
        aprobadoPorId: usuario.id,
        fechaAprobacion: new Date(),
        razonRechazo: reason
      }
    })

    return NextResponse.json({
      message: 'Proyecto rechazado exitosamente',
      proyecto: proyectoActualizado
    })
  } catch (error) {
    console.error('Error al rechazar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al rechazar proyecto' },
      { status: 500 }
    )
  }
} 