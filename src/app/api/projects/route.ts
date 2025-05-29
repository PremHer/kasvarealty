import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { EstadoProyecto, TipoProyecto } from '@prisma/client'

type Rol = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE_GENERAL' | 'PROJECT_MANAGER'

interface Usuario {
  id: string
  nombre: string
  email: string
}

interface Proyecto {
  id: string
  nombre: string
  descripcion: string
  direccion: string
  departamento: string | null
  provincia: string | null
  distrito: string | null
  latitud: number | null
  longitud: number | null
  fechaInicio: Date
  fechaFin: Date | null
  precioTerreno: number | null
  inversionInicial: number | null
  inversionTotal: number | null
  inversionActual: number | null
  estado: string
  empresaDesarrolladoraId: string
  gerenteId: string
  creadoPorId: string
  aprobadoPorId: string | null
  fechaAprobacion: Date | null
  razonRechazo: string | null
  areaTotal: number | null
  areaUtil: number | null
  cantidadUnidades: number | null
  tipo: string
  creadoPor: Usuario
  aprobadoPor: Usuario | null
  gerente: Usuario
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el usuario y su rol
    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar si el usuario tiene permiso para ver proyectos
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER'].includes(usuario.rol)) {
      return NextResponse.json([], { status: 200 })
    }

    // Construir la condición where según el rol
    let whereClause = {}
    
    if (usuario.rol === 'PROJECT_MANAGER') {
      // Project Manager solo ve sus proyectos asignados
      whereClause = {
        gerenteId: usuario.id
      }
    } else if (usuario.rol === 'GERENTE_GENERAL') {
      // Gerente General ve proyectos de su empresa donde es representante legal
      // y también ve los proyectos pendientes de asignación
      whereClause = {
        AND: [
          {
            empresaDesarrolladora: {
              representanteLegalId: usuario.id
            }
          },
          {
            OR: [
              {
                estado: {
                  not: EstadoProyecto.PENDING_ASSIGNMENT
                }
              },
              {
                estado: EstadoProyecto.PENDING_ASSIGNMENT
              }
            ]
          }
        ]
      }
    }
    // SUPER_ADMIN y ADMIN ven todos los proyectos (whereClause vacío)

    const proyectos = await prisma.proyecto.findMany({
      where: whereClause,
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
            nombre: true,
            representanteLegalId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filtrar los proyectos según el rol después de obtenerlos
    let filteredProjects = proyectos

    if (usuario.rol === 'GERENTE_GENERAL') {
      // Para el gerente general, mostrar todos los proyectos de su empresa
      // Los proyectos pendientes de asignación se manejarán en el frontend
      filteredProjects = proyectos
    }

    const projects = filteredProjects.map((proyecto) => ({
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
      manager: proyecto.gerente
        ? {
            id: proyecto.gerente.id,
            name: proyecto.gerente.nombre,
            email: proyecto.gerente.email
          }
        : null
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    // Solo los roles autorizados pueden crear proyectos
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER'].includes(usuario.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const data = await request.json()

    // Si es gerente general, verificar que la empresa pertenece al usuario
    if (usuario.rol === 'GERENTE_GENERAL') {
      const empresa = await prisma.empresaDesarrolladora.findFirst({
        where: {
          id: data.developerCompanyId,
          representanteLegalId: usuario.id
        }
      })

      if (!empresa) {
        return NextResponse.json(
          { error: 'No tienes permiso para crear proyectos en esta empresa' },
          { status: 403 }
        )
      }
    }

    // Mapear los campos del inglés al español
    const proyectoData = {
      nombre: data.name,
      descripcion: data.description,
      direccion: data.location,
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      latitud: data.latitud ? parseFloat(data.latitud) : null,
      longitud: data.longitud ? parseFloat(data.longitud) : null,
      fechaInicio: new Date(data.startDate),
      fechaFin: data.endDate ? new Date(data.endDate) : null,
      precioTerreno: data.precioTerreno ? parseFloat(data.precioTerreno) : null,
      inversionInicial: data.inversionInicial ? parseFloat(data.inversionInicial) : null,
      inversionTotal: data.inversionTotal ? parseFloat(data.inversionTotal) : null,
      inversionActual: data.inversionActual ? parseFloat(data.inversionActual) : null,
      estado: data.managerId ? EstadoProyecto.APPROVED : EstadoProyecto.PENDING_ASSIGNMENT,
      empresaDesarrolladoraId: data.developerCompanyId,
      gerenteId: data.managerId || usuario.id, // Si no hay manager asignado, se asigna al creador temporalmente
      creadoPorId: usuario.id,
      aprobadoPorId: data.managerId ? usuario.id : null,
      fechaAprobacion: data.managerId ? new Date() : null,
      razonRechazo: null,
      areaTotal: data.totalArea ? parseFloat(data.totalArea) : null,
      areaUtil: data.usableArea ? parseFloat(data.usableArea) : null,
      cantidadUnidades: data.totalUnits ? parseInt(data.totalUnits) : null,
      tipo: data.type as TipoProyecto
    }

    const proyecto = await prisma.proyecto.create({
      data: proyectoData,
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

    return NextResponse.json({
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
      manager: proyecto.gerente
        ? {
            id: proyecto.gerente.id,
            name: proyecto.gerente.nombre,
            email: proyecto.gerente.email
          }
        : null
    })
  } catch (error) {
    console.error('Error al crear proyecto:', error)
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }
} 