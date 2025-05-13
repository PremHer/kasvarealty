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

    // Solo los gerentes generales y administradores pueden rechazar proyectos
    if (!['GERENTE_GENERAL', 'ADMIN', 'SUPER_ADMIN'].includes(usuario.rol)) {
      return NextResponse.json(
        { error: 'No tienes permiso para rechazar proyectos' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { rejectionReason } = data

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Se requiere una razón para rechazar el proyecto' },
        { status: 400 }
      )
    }

    // Obtener el proyecto actual
    const proyectoActual = await prisma.proyecto.findUnique({
      where: { id: params.id }
    })

    if (!proyectoActual) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el proyecto esté pendiente de aprobación
    if (proyectoActual.estado !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'El proyecto no está pendiente de aprobación' },
        { status: 400 }
      )
    }

    // Actualizar el estado del proyecto a REJECTED
    const proyecto = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        estado: 'REJECTED',
        aprobadoPorId: usuario.id,
        fechaAprobacion: new Date(),
        razonRechazo: rejectionReason
      }
    })

    // Transformar la respuesta al formato en inglés para mantener la compatibilidad
    const project = {
      id: proyecto.id,
      name: proyecto.nombre,
      description: proyecto.descripcion,
      location: proyecto.direccion,
      departamento: proyecto.departamento,
      provincia: proyecto.provincia,
      distrito: proyecto.distrito,
      latitud: proyecto.latitud,
      longitud: proyecto.longitud,
      startDate: proyecto.fechaInicio,
      endDate: proyecto.fechaFin,
      precioTerreno: proyecto.precioTerreno,
      inversionInicial: proyecto.inversionInicial,
      inversionTotal: proyecto.inversionTotal,
      inversionActual: proyecto.inversionActual,
      status: proyecto.estado,
      developerCompanyId: proyecto.empresaDesarrolladoraId,
      managerId: proyecto.gerenteId,
      createdById: proyecto.creadoPorId,
      approvedById: proyecto.aprobadoPorId,
      approvedAt: proyecto.fechaAprobacion,
      rejectionReason: proyecto.razonRechazo,
      type: proyecto.tipo,
      totalArea: proyecto.areaTotal,
      usableArea: proyecto.areaUtil,
      totalUnits: proyecto.cantidadUnidades
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error al rechazar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al rechazar proyecto' },
      { status: 500 }
    )
  }
} 