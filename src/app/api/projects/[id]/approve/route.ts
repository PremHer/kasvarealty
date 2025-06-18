import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Solo los gerentes generales pueden aprobar proyectos
    if (usuario.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que el proyecto existe y pertenece a una empresa donde el usuario es representante legal
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        id: params.id,
        estado: 'PENDING_APPROVAL',
        empresaDesarrolladora: {
          representanteLegalId: usuario.id
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado o no tienes permiso para aprobarlo' },
        { status: 404 }
      )
    }

    // Actualizar el estado del proyecto a APPROVED
    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        estado: 'APPROVED',
        aprobadoPorId: usuario.id,
        fechaAprobacion: new Date()
      }
    })

    return NextResponse.json({
      message: 'Proyecto aprobado exitosamente',
      proyecto: proyectoActualizado
    })
  } catch (error) {
    console.error('Error al aprobar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al aprobar proyecto' },
      { status: 500 }
    )
  }
} 