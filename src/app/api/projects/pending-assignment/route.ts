import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoProyecto } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Solo permitir acceso a gerentes generales
    if (session.user.role !== 'GERENTE_GENERAL') {
      return new NextResponse('No autorizado', { status: 403 })
    }

    // Obtener las empresas donde el usuario es representante legal
    const empresasRepresentante = await prisma.empresaDesarrolladora.findMany({
      where: {
        representanteLegalId: session.user.id
      },
      select: {
        id: true
      }
    })

    const empresasIds = empresasRepresentante.map(empresa => empresa.id)

    // Obtener proyectos pendientes de asignación solo de las empresas donde es representante legal
    const proyectos = await prisma.proyecto.findMany({
      where: {
        AND: [
          {
            estado: EstadoProyecto.APPROVED
          },
          {
            OR: [
              { gerenteId: null },
              { gerenteId: '' }
            ]
          },
          {
            empresaDesarrolladoraId: {
              in: empresasIds
            }
          }
        ]
      },
      include: {
        empresaDesarrolladora: {
          select: {
            id: true,
            nombre: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const projects = proyectos.map(proyecto => ({
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
      createdBy: proyecto.creadoPor ? {
        id: proyecto.creadoPor.id,
        name: proyecto.creadoPor.nombre,
        email: proyecto.creadoPor.email,
        role: proyecto.creadoPor.rol
      } : null,
      createdAt: proyecto.createdAt
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error al obtener proyectos pendientes de asignación:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 