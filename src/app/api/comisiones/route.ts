import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Roles permitidos para gestionar comisiones
const COMISION_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'FINANCE_MANAGER',
  'SALES_MANAGER',
  'ACCOUNTANT',
  'GERENTE_GENERAL'
]

// GET /api/comisiones - Listar ventas con comisiones
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver comisiones
    if (!COMISION_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver comisiones' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const vendedorId = searchParams.get('vendedorId')
    const estado = searchParams.get('estado')
    const proyectoId = searchParams.get('proyectoId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros
    let whereClause: any = {
      estado: 'APROBADA', // Solo ventas aprobadas
      comisionVendedor: {
        gt: 0 // Solo ventas con comisión
      }
    }

    if (vendedorId) {
      whereClause.vendedorId = vendedorId
    }

    // Obtener ventas de lotes con comisiones
    const ventasLotes = await prisma.ventaLote.findMany({
      where: {
        ...whereClause,
        ...(proyectoId && {
          lote: {
            manzana: {
              proyectoId: proyectoId
            }
          }
        })
      },
      include: {
        lote: {
          include: {
            manzana: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                proyectoId: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        pagosComisiones: {
          include: {
            comprobantes: true,
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          },
          orderBy: {
            fechaPago: 'desc'
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      skip,
      take: limit
    })

    // Obtener ventas de unidades de cementerio con comisiones
    const ventasUnidadesCementerio = await prisma.ventaUnidadCementerio.findMany({
      where: {
        ...whereClause,
        ...(proyectoId && {
          unidadCementerio: {
            pabellon: {
              proyectoId: proyectoId
            }
          }
        })
      },
      include: {
        unidadCementerio: {
          include: {
            pabellon: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                proyectoId: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        pagosComisiones: {
          include: {
            comprobantes: true,
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          },
          orderBy: {
            fechaPago: 'desc'
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      skip,
      take: limit
    })

    // Combinar y formatear resultados
    const ventasConComisiones = [
      ...ventasLotes.map((venta: any) => {
        const montoPagado = venta.pagosComisiones.reduce((sum: number, pago: any) => sum + pago.monto, 0)
        const montoPendiente = (venta.comisionVendedor || 0) - montoPagado
        const porcentajePagado = venta.comisionVendedor > 0 ? (montoPagado / venta.comisionVendedor) * 100 : 0

        return {
          ...venta,
          tipoVenta: 'LOTE',
          unidad: {
            id: venta.lote.id,
            codigo: venta.lote.codigo,
            manzana: venta.lote.manzana.nombre,
            manzanaCodigo: venta.lote.manzana.codigo
          },
          montoPagado,
          montoPendiente,
          porcentajePagado,
          estadoComision: montoPendiente <= 0 ? 'PAGADA' : montoPagado > 0 ? 'PARCIAL' : 'PENDIENTE'
        }
      }),
      ...ventasUnidadesCementerio.map((venta: any) => {
        const montoPagado = venta.pagosComisiones.reduce((sum: number, pago: any) => sum + pago.monto, 0)
        const montoPendiente = (venta.comisionVendedor || 0) - montoPagado
        const porcentajePagado = venta.comisionVendedor > 0 ? (montoPagado / venta.comisionVendedor) * 100 : 0

        return {
          ...venta,
          tipoVenta: 'UNIDAD_CEMENTERIO',
          unidad: {
            id: venta.unidadCementerio.id,
            codigo: venta.unidadCementerio.codigo,
            pabellon: venta.unidadCementerio.pabellon.nombre,
            pabellonCodigo: venta.unidadCementerio.pabellon.codigo
          },
          montoPagado,
          montoPendiente,
          porcentajePagado,
          estadoComision: montoPendiente <= 0 ? 'PAGADA' : montoPagado > 0 ? 'PARCIAL' : 'PENDIENTE'
        }
      })
    ]

    // Filtrar por estado si se especifica
    let ventasFiltradas = ventasConComisiones
    if (estado) {
      ventasFiltradas = ventasConComisiones.filter(venta => venta.estadoComision === estado)
    }

    // Calcular estadísticas
    const stats = {
      totalVentas: ventasFiltradas.length,
      ventasPendientes: ventasFiltradas.filter(v => v.estadoComision === 'PENDIENTE').length,
      ventasParciales: ventasFiltradas.filter(v => v.estadoComision === 'PARCIAL').length,
      ventasPagadas: ventasFiltradas.filter(v => v.estadoComision === 'PAGADA').length,
      montoTotalComisiones: ventasFiltradas.reduce((sum, v) => sum + (v.comisionVendedor || 0), 0),
      montoTotalPagado: ventasFiltradas.reduce((sum, v) => sum + v.montoPagado, 0),
      montoTotalPendiente: ventasFiltradas.reduce((sum, v) => sum + v.montoPendiente, 0)
    }

    return NextResponse.json({
      ventas: ventasFiltradas,
      stats,
      pagination: {
        page,
        limit,
        total: ventasFiltradas.length,
        totalPages: Math.ceil(ventasFiltradas.length / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener comisiones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 