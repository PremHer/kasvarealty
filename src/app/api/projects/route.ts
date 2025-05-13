import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

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

    const proyectos = await prisma.proyecto.findMany({
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
      return NextResponse.json(
        { error: 'No tienes permiso para crear proyectos' },
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

    // Validar datos requeridos
    if (!name || !description || !location || !startDate || !developerCompanyId || !type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Crear el proyecto con estado PENDING_APPROVAL
    const proyecto = await prisma.proyecto.create({
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
        cantidadUnidades: totalUnits ? parseInt(totalUnits) : null,
        estado: 'PENDING_APPROVAL',
        gerenteId: usuario.id,
        creadoPorId: usuario.id
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
      developerCompany: proyecto.empresaDesarrolladora ? {
        id: proyecto.empresaDesarrolladora.id,
        name: proyecto.empresaDesarrolladora.nombre
      } : null,
      managerId: proyecto.gerenteId,
      createdById: proyecto.creadoPorId,
      type: proyecto.tipo,
      totalArea: proyecto.areaTotal,
      usableArea: proyecto.areaUtil,
      totalUnits: proyecto.cantidadUnidades
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error al crear proyecto:', error)
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }
} 