import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para auditoría
const AUDIT_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'FINANCE_MANAGER'
]

// GET /api/auditoria - Obtener registros de auditoría
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver auditoría
    if (!AUDIT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver auditoría' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const usuarioId = searchParams.get('usuarioId')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Construir filtros
    let whereClause: any = {}

    if (tipo) {
      whereClause.tipo = tipo
    }

    if (usuarioId) {
      whereClause.usuarioId = usuarioId
    }

    if (fechaInicio && fechaFin) {
      whereClause.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    // Obtener registros de auditoría
    const [registros, total] = await Promise.all([
      prisma.auditoria.findMany({
        where: whereClause,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.auditoria.count({
        where: whereClause
      })
    ])

    return NextResponse.json({
      registros,
      paginacion: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filtros: {
        tipo,
        usuarioId,
        fechaInicio,
        fechaFin
      }
    })

  } catch (error) {
    console.error('Error al obtener auditoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/auditoria - Crear registro de auditoría
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, accion, detalles, entidad, entidadId, ip, userAgent } = body

    if (!tipo || !accion) {
      return NextResponse.json({ error: 'Tipo y acción son requeridos' }, { status: 400 })
    }

    // Crear registro de auditoría
    const registro = await prisma.auditoria.create({
      data: {
        tipo,
        accion,
        detalles: detalles || null,
        entidad: entidad || null,
        entidadId: entidadId || null,
        ip: ip || null,
        userAgent: userAgent || null,
        usuarioId: session.user.id,
        fecha: new Date()
      }
    })

    return NextResponse.json({
      registro,
      message: 'Registro de auditoría creado correctamente'
    })

  } catch (error) {
    console.error('Error al crear registro de auditoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 