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
      approvedBy: proyecto.estado === 'APPROVED' && proyecto.aprobadoPor
        ? {
            id: proyecto.aprobadoPor.id,
            name: proyecto.aprobadoPor.nombre,
            email: proyecto.aprobadoPor.email
          }
        : null,
      rejectedBy: proyecto.estado === 'REJECTED' && proyecto.aprobadoPor
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
      },
      razonRechazo: proyecto.razonRechazo
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

export async function PUT(
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
      select: { role: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de edición
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: {
          select: {
            representanteLegalId: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar si el usuario tiene permiso para editar
    const canEdit = 
      ['SUPER_ADMIN', 'ADMIN'].includes(usuario.role) || // Super Admin y Admin pueden editar cualquier proyecto
      (usuario.role === 'PROJECT_MANAGER' && proyecto.gerenteId === usuario.id) || // Project Manager solo puede editar sus proyectos
      (usuario.role === 'GERENTE_GENERAL' && proyecto.empresaDesarrolladora?.representanteLegalId === usuario.id) // Gerente General solo puede editar proyectos de su empresa

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este proyecto' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const {
      name,
      description,
      location,
      departamento,
      provincia,
      distrito,
      latitud,
      longitud,
      startDate,
      endDate,
      precioTerreno,
      inversionInicial,
      inversionTotal,
      inversionActual,
      developerCompanyId,
      type,
      totalArea,
      usableArea,
      totalUnits
    } = data

    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        nombre: name,
        descripcion: description,
        direccion: location,
        departamento: departamento || null,
        provincia: provincia || null,
        distrito: distrito || null,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        fechaInicio: new Date(startDate),
        fechaFin: endDate ? new Date(endDate) : null,
        precioTerreno: precioTerreno ? parseFloat(precioTerreno) : null,
        inversionInicial: inversionInicial ? parseFloat(inversionInicial) : null,
        inversionTotal: inversionTotal ? parseFloat(inversionTotal) : null,
        inversionActual: inversionActual ? parseFloat(inversionActual) : null,
        empresaDesarrolladoraId: developerCompanyId,
        tipo: type,
        areaTotal: totalArea ? parseFloat(totalArea) : null,
        areaUtil: usableArea ? parseFloat(usableArea) : null,
        cantidadUnidades: totalUnits ? parseInt(totalUnits) : null
      }
    })

    return NextResponse.json(proyectoActualizado)
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
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
      select: { role: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de eliminación
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: {
          select: {
            representanteLegalId: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar si el usuario tiene permiso para eliminar
    const canDelete = 
      ['SUPER_ADMIN', 'ADMIN'].includes(usuario.role) || // Super Admin y Admin pueden eliminar cualquier proyecto
      (usuario.role === 'PROJECT_MANAGER' && proyecto.gerenteId === usuario.id) || // Project Manager solo puede eliminar sus proyectos
      (usuario.role === 'GERENTE_GENERAL' && proyecto.empresaDesarrolladora?.representanteLegalId === usuario.id) // Gerente General solo puede eliminar proyectos de su empresa

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este proyecto' },
        { status: 403 }
      )
    }

    await prisma.proyecto.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Proyecto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    )
  }
} 