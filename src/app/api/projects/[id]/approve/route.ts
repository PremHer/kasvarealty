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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo GERENTE_GENERAL, ADMIN y SUPER_ADMIN pueden aprobar proyectos
    if (!['GERENTE_GENERAL', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permiso para aprobar proyectos' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { approved, rejectionReason } = data

    // Validar que el proyecto existe y está pendiente de aprobación
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    if (project.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'El proyecto no está pendiente de aprobación' },
        { status: 400 }
      )
    }

    // Actualizar el estado del proyecto
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approved ? user.id : null,
        approvedAt: approved ? new Date() : null,
        rejectionReason: !approved ? rejectionReason : null
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error al aprobar/rechazar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
} 