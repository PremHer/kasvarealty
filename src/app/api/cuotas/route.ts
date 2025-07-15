import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoCuota } from '@prisma/client'

// Definir roles permitidos para gestión de cuotas
const CUOTAS_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'FINANCE_MANAGER',
  'ACCOUNTANT'
]

// GET /api/cuotas - Listar cuotas con filtros
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver cuotas' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const ventaId = searchParams.get('ventaId')
    const estado = searchParams.get('estado')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Construir filtros
    let whereClause: any = {}

    if (ventaId) {
      whereClause.OR = [
        { ventaLoteId: ventaId },
        { ventaUnidadCementerioId: ventaId }
      ]
    }

    if (estado) {
      whereClause.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      whereClause.fechaVencimiento = {}
      if (fechaDesde) {
        whereClause.fechaVencimiento.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        whereClause.fechaVencimiento.lte = new Date(fechaHasta)
      }
    }

    // Restricciones según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo ve cuotas de sus ventas
      whereClause.OR = [
        {
          ventaLote: {
            vendedorId: session.user.id
          }
        },
        {
          ventaUnidadCementerio: {
            vendedorId: session.user.id
          }
        }
      ]
    }

    // Obtener cuotas
    const [cuotas, total] = await Promise.all([
      prisma.cuota.findMany({
        where: whereClause,
        include: {
          ventaLote: {
            include: {
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
              lote: {
                include: {
                  manzana: {
                    include: {
                      proyecto: {
                        select: {
                          id: true,
                          nombre: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          ventaUnidadCementerio: {
            include: {
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
              unidadCementerio: {
                include: {
                  pabellon: {
                    include: {
                      proyecto: {
                        select: {
                          id: true,
                          nombre: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          actualizadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        },
        orderBy: [
          { fechaVencimiento: 'asc' },
          { numeroCuota: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.cuota.count({ where: whereClause })
    ])

    // Actualizar automáticamente el estado de las cuotas vencidas
    const fechaActual = new Date()
    const cuotasVencidas = cuotas.filter(cuota => 
      cuota.fechaVencimiento < fechaActual && 
      cuota.estado === 'PENDIENTE'
    )

    if (cuotasVencidas.length > 0) {
      await prisma.cuota.updateMany({
        where: {
          id: {
            in: cuotasVencidas.map(c => c.id)
          }
        },
        data: {
          estado: 'VENCIDA',
          updatedBy: session.user.id
        }
      })

      // Actualizar el estado en los resultados
      cuotas.forEach(cuota => {
        if (cuota.fechaVencimiento < fechaActual && cuota.estado === 'PENDIENTE') {
          cuota.estado = 'VENCIDA'
        }
      })
    }

    // Formatear respuesta
    const cuotasFormateadas = cuotas.map(cuota => {
      const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
      const unidad = cuota.ventaLote?.lote || cuota.ventaUnidadCementerio?.unidadCementerio
      const proyecto = cuota.ventaLote?.lote?.manzana?.proyecto || cuota.ventaUnidadCementerio?.unidadCementerio?.pabellon?.proyecto
      
      return {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        monto: cuota.monto,
        fechaVencimiento: cuota.fechaVencimiento,
        fechaPago: cuota.fechaPago,
        montoPagado: cuota.montoPagado,
        estado: cuota.estado,
        observaciones: cuota.observaciones,
        ventaId: cuota.ventaLoteId || cuota.ventaUnidadCementerioId,
        tipoVenta: cuota.ventaLoteId ? 'LOTE' : 'UNIDAD_CEMENTERIO',
        cliente: venta?.cliente,
        vendedor: venta?.vendedor,
        unidad: {
          id: unidad?.id,
          codigo: unidad?.codigo,
          tipo: cuota.ventaLoteId ? 'Lote' : 'Unidad Cementerio'
        },
        proyecto: {
          id: proyecto?.id,
          nombre: proyecto?.nombre
        },
        creadoPor: cuota.creadoPorUsuario,
        actualizadoPor: cuota.actualizadoPorUsuario,
        createdAt: cuota.createdAt,
        updatedAt: cuota.updatedAt
      }
    })

    return NextResponse.json({
      cuotas: cuotasFormateadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener cuotas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/cuotas - Crear cuota manualmente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para crear cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear cuotas' }, { status: 403 })
    }

    const body = await request.json()
    const {
      ventaId,
      tipoVenta,
      numeroCuota,
      monto,
      fechaVencimiento,
      observaciones
    } = body

    // Validaciones
    if (!ventaId || !tipoVenta || !numeroCuota || !monto || !fechaVencimiento) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la venta existe
    let venta
    if (tipoVenta === 'LOTE') {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaId }
      })
    } else {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId }
      })
    }

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Crear la cuota
    const cuota = await prisma.cuota.create({
      data: {
        numeroCuota: parseInt(numeroCuota),
        monto: parseFloat(monto),
        fechaVencimiento: new Date(fechaVencimiento),
        estado: EstadoCuota.PENDIENTE,
        montoPagado: 0,
        observaciones,
        ventaLoteId: tipoVenta === 'LOTE' ? ventaId : null,
        ventaUnidadCementerioId: tipoVenta === 'UNIDAD_CEMENTERIO' ? ventaId : null,
        createdBy: session.user.id
      },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            vendedor: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            vendedor: true
          }
        }
      }
    })

    return NextResponse.json(cuota, { status: 201 })

  } catch (error) {
    console.error('Error al crear cuota:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 