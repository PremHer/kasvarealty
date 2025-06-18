import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
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

    // Solo los gerentes generales pueden ver proyectos pendientes
    if (usuario.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener proyectos pendientes de las empresas donde el usuario es representante legal
    const proyectos = await prisma.proyecto.findMany({
      where: {
        estado: 'PENDING_APPROVAL',
        empresaDesarrolladora: {
          representanteLegalId: usuario.id
        }
      },
      include: {
        creadoPor: {
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
            nombre: true,
            representanteLegalId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const projects = proyectos.map((proyecto) => ({
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
        name: proyecto.empresaDesarrolladora.nombre,
        representanteLegalId: proyecto.empresaDesarrolladora.representanteLegalId
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
      manager: {
        id: proyecto.gerente.id,
        name: proyecto.gerente.nombre,
        email: proyecto.gerente.email
      },
      createdAt: proyecto.createdAt
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error al obtener proyectos pendientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos pendientes' },
      { status: 500 }
    )
  }
} 