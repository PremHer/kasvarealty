import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        gerente: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        empresaDesarrolladora: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

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
      developerCompany: proyecto.empresaDesarrolladora ? {
        id: proyecto.empresaDesarrolladora.id,
        name: proyecto.empresaDesarrolladora.nombre
      } : null,
      managerId: proyecto.gerenteId,
      createdById: proyecto.creadoPorId,
      type: proyecto.tipo,
      totalArea: proyecto.areaTotal,
      usableArea: proyecto.areaUtil,
      totalUnits: proyecto.cantidadUnidades,
      createdBy: {
        id: proyecto.creadoPor.id,
        name: proyecto.creadoPor.nombre,
        email: proyecto.creadoPor.email
      },
      approvedBy: proyecto.aprobadoPor
        ? {
            id: proyecto.aprobadoPor.id,
            name: proyecto.aprobadoPor.nombre,
            email: proyecto.aprobadoPor.email
          }
        : null,
      manager: {
        id: proyecto.gerente.id,
        name: proyecto.gerente.nombre,
        email: proyecto.gerente.email
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error al obtener proyecto:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: true
      }
    })

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(usuario.rol) ||
      (usuario.rol === 'GERENTE_GENERAL' && proyecto.empresaDesarrolladoraId === usuario.empresaId) ||
      (usuario.rol === 'PROJECT_MANAGER' && proyecto.gerenteId === usuario.id)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este proyecto' },
        { status: 403 }
      )
    }

    await prisma.proyecto.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    )
  }
} 