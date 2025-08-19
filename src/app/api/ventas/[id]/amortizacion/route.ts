import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const ventaId = params.id

    // Obtener la venta con sus cuotas
    const venta = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' },
          include: {
            pagos: {
              include: {
                // reciboPago: true // Campo no existe en el esquema
              }
            }
          }
        },
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
    })

    if (!venta) {
      // Intentar buscar en ventaUnidadCementerio
      const ventaUnidad = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId },
        include: {
          cuotas: {
            orderBy: { numeroCuota: 'asc' },
            include: {
                          pagos: {
              include: {
                // reciboPago: true // Campo no existe en el esquema
              }
            }
            }
          },
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
      })

      if (!ventaUnidad) {
        return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
      }

      // Procesar cuotas de ventaUnidadCementerio
      const cuotas = ventaUnidad.cuotas.map(cuota => {
        const montoPagado = cuota.pagos.reduce((sum, pago) => sum + pago.monto, 0)
        const estado = montoPagado >= cuota.monto ? 'PAGADA' : 
                      new Date() > new Date(cuota.fechaVencimiento) ? 'VENCIDA' : 'PENDIENTE'
        
        return {
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          monto: cuota.monto,
          montoCapital: cuota.montoCapital || 0,
          montoInteres: cuota.montoInteres || 0,
          saldoCapitalAnterior: cuota.saldoCapitalAnterior || 0,
          saldoCapitalPosterior: cuota.saldoCapitalPosterior || 0,
          estado,
          fechaPago: montoPagado >= cuota.monto ? cuota.pagos[0]?.fechaPago : null,
          montoPagado,
          montoPendiente: cuota.monto - montoPagado
        }
      })

      return NextResponse.json({
        venta: ventaUnidad,
        cuotas,
        tipo: 'UNIDAD_CEMENTERIO'
      })
    }

    // Procesar cuotas de ventaLote
    const cuotas = venta.cuotas.map(cuota => {
      const montoPagado = cuota.pagos.reduce((sum, pago) => sum + pago.monto, 0)
      const estado = montoPagado >= cuota.monto ? 'PAGADA' : 
                    new Date() > new Date(cuota.fechaVencimiento) ? 'VENCIDA' : 'PENDIENTE'
      
      return {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        fechaVencimiento: cuota.fechaVencimiento,
        monto: cuota.monto,
        montoCapital: cuota.montoCapital || 0,
        montoInteres: cuota.montoInteres || 0,
        saldoCapitalAnterior: cuota.saldoCapitalAnterior || 0,
        saldoCapitalPosterior: cuota.saldoCapitalPosterior || 0,
        estado,
        fechaPago: montoPagado >= cuota.monto ? cuota.pagos[0]?.fechaPago : null,
        montoPagado,
        montoPendiente: cuota.monto - montoPagado
      }
    })

    return NextResponse.json({
      venta,
      cuotas,
      tipo: 'LOTE'
    })

  } catch (error) {
    console.error('Error al obtener amortización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 