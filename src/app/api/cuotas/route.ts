import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoCuota } from '@prisma/client'

// Definir roles permitidos para gestión de cuotas
const CUOTAS_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'FINANCE_MANAGER',
  'ACCOUNTANT',
  'GERENTE_GENERAL'
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const ventaId = searchParams.get('ventaId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construir filtros
    let whereClause: any = {}

    if (ventaId) {
      whereClause.OR = [
        { ventaLoteId: ventaId },
        { ventaUnidadCementerioId: ventaId }
      ]
    }

    const cuotas = await prisma.cuota.findMany({
      where: whereClause,
      take: limit,
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: {
              include: {
                manzana: {
                  include: {
                    proyecto: true
                  }
                }
              }
            }
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: {
              include: {
                pabellon: {
                  include: {
                    proyecto: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { numeroCuota: 'asc' },
        { fechaVencimiento: 'asc' }
      ]
    })

    return NextResponse.json({
      cuotas: cuotas.map(cuota => {
        const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
        const cliente = venta?.cliente
        const unidad = cuota.ventaLote?.lote || cuota.ventaUnidadCementerio?.unidadCementerio
        const proyecto = cuota.ventaLote?.lote?.manzana?.proyecto || cuota.ventaUnidadCementerio?.unidadCementerio?.pabellon?.proyecto
        
        return {
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          monto: cuota.monto,
          montoPagado: cuota.montoPagado,
          estado: cuota.estado,
          fechaVencimiento: cuota.fechaVencimiento,
          // NUEVO: Campos de amortización
          montoCapital: cuota.montoCapital,
          montoInteres: cuota.montoInteres,
          saldoCapitalAnterior: cuota.saldoCapitalAnterior,
          saldoCapitalPosterior: cuota.saldoCapitalPosterior,
          // NUEVO: Campos de intereses por mora
          interesMora: cuota.interesMora,
          diasVencidos: cuota.diasVencidos,
          cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'N/A',
          unidad: unidad ? (cuota.ventaLote ? `Lote ${(unidad as any).numero || (unidad as any).codigo}` : `Unidad ${(unidad as any).codigo}`) : 'N/A',
          proyecto: proyecto?.nombre || 'N/A',
          ventaId: cuota.ventaLoteId || cuota.ventaUnidadCementerioId,
          tipoVenta: cuota.ventaLoteId ? 'LOTE' : 'UNIDAD_CEMENTERIO'
        }
      })
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