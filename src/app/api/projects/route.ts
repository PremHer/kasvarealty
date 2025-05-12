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
  fechaInicio: Date
  fechaFin: Date | null
  presupuesto: number
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { id: true, rol: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Filtrar proyectos según el rol del usuario
    let proyectos
    switch (usuario.rol) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'GERENTE_GENERAL':
        // Pueden ver todos los proyectos
        proyectos = await prisma.proyecto.findMany({
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
            }
          }
        })
        break
      case 'PROJECT_MANAGER':
        // Solo ve los proyectos que maneja
        proyectos = await prisma.proyecto.findMany({
          where: {
            gerenteId: usuario.id
          },
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
            }
          }
        })
        break
      default:
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Transformar los nombres de los campos al formato en inglés para mantener la compatibilidad
    const projects = proyectos.map((proyecto: Proyecto) => ({
      id: proyecto.id,
      name: proyecto.nombre,
      description: proyecto.descripcion,
      location: proyecto.direccion,
      startDate: proyecto.fechaInicio,
      endDate: proyecto.fechaFin,
      budget: proyecto.presupuesto,
      status: proyecto.estado,
      createdBy: {
        id: proyecto.creadoPor.id,
        name: proyecto.creadoPor.nombre,
        email: proyecto.creadoPor.email
      },
      approvedBy: proyecto.aprobadoPor ? {
        id: proyecto.aprobadoPor.id,
        name: proyecto.aprobadoPor.nombre,
        email: proyecto.aprobadoPor.email
      } : null,
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

    // Solo PROJECT_MANAGER puede crear proyectos
    if (usuario.rol !== 'PROJECT_MANAGER') {
      return NextResponse.json(
        { error: 'Solo los gerentes de proyecto pueden crear proyectos' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { name, description, location, startDate, endDate, budget, developerCompanyId, type } = data

    // Validar datos requeridos
    if (!name || !description || !location || !startDate || !budget || !developerCompanyId || !type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Crear el proyecto
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre: name,
        descripcion: description,
        direccion: location,
        fechaInicio: new Date(startDate),
        fechaFin: endDate ? new Date(endDate) : null,
        presupuesto: parseFloat(budget),
        estado: 'PENDING_APPROVAL',
        creadoPorId: usuario.id,
        gerenteId: usuario.id,
        empresaDesarrolladoraId: developerCompanyId,
        tipo: type
      }
    })

    // Transformar la respuesta al formato en inglés para mantener la compatibilidad
    const project = {
      id: proyecto.id,
      name: proyecto.nombre,
      description: proyecto.descripcion,
      location: proyecto.direccion,
      startDate: proyecto.fechaInicio,
      endDate: proyecto.fechaFin,
      budget: proyecto.presupuesto,
      status: proyecto.estado,
      developerCompanyId: proyecto.empresaDesarrolladoraId,
      managerId: proyecto.gerenteId,
      createdById: proyecto.creadoPorId,
      type: proyecto.tipo
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