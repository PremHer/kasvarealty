import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoCuota } from '@prisma/client'

// Definir roles permitidos para ventas
const SALES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT'
]

// Definir roles que pueden crear ventas
const CAN_CREATE_SALES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'SALES_REP'
]

// GET /api/ventas - Listar ventas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver ventas' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const proyectoId = searchParams.get('proyectoId')
    const vendedorId = searchParams.get('vendedorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros según el rol del usuario
    let whereClause: any = {}

    // Filtrar por estado si se especifica
    if (estado) {
      whereClause.estado = estado
    }

    // Filtrar por proyecto si se especifica
    if (proyectoId) {
      whereClause.proyectoId = proyectoId
    }

    // Filtrar por vendedor si se especifica
    if (vendedorId) {
      whereClause.vendedorId = vendedorId
    }

    // Restricciones según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo ve sus propias ventas
      whereClause.vendedorId = session.user.id
    }

    // Obtener ventas de lotes
    const ventasLotes = await prisma.ventaLote.findMany({
      where: whereClause,
      include: {
        lote: {
          include: {
            manzana: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Obtener ventas de unidades de cementerio
    const ventasUnidadesCementerio = await prisma.ventaUnidadCementerio.findMany({
      where: whereClause,
      include: {
        unidadCementerio: {
          include: {
            pabellon: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Combinar y formatear resultados
    const ventas = [
      ...ventasLotes.map((venta: any) => ({
        ...venta,
        tipoVenta: 'LOTE',
        unidad: {
          id: venta.lote.id,
          codigo: venta.lote.codigo,
          manzana: venta.lote.manzana.nombre,
          manzanaCodigo: venta.lote.manzana.codigo
        }
      })),
      ...ventasUnidadesCementerio.map((venta: any) => ({
        ...venta,
        tipoVenta: 'UNIDAD_CEMENTERIO',
        unidad: {
          id: venta.unidadCementerio.id,
          codigo: venta.unidadCementerio.codigo,
          pabellon: venta.unidadCementerio.pabellon.nombre,
          pabellonCodigo: venta.unidadCementerio.pabellon.codigo
        }
      }))
    ]

    // Contar total de registros para paginación
    const totalVentasLotes = await prisma.ventaLote.count({ where: whereClause })
    const totalVentasUnidades = await prisma.ventaUnidadCementerio.count({ where: whereClause })
    const total = totalVentasLotes + totalVentasUnidades

    return NextResponse.json({
      ventas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 