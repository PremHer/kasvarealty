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

    // Buscar la venta con todos sus datos
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' }
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

    let ventaUnidad = null
    let tipoVenta = 'LOTE'
    let venta: any = ventaLote

    if (!ventaLote) {
      ventaUnidad = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId },
        include: {
          cuotas: {
            orderBy: { numeroCuota: 'asc' }
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
      tipoVenta = 'UNIDAD_CEMENTERIO'
      venta = ventaUnidad
    }

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Extraer datos relevantes para amortización
    const datosAmortizacion = {
      id: venta.id,
      tipoVenta,
      precioVenta: venta.precioVenta,
      saldoPendiente: venta.saldoPendiente,
      numeroCuotas: venta.numeroCuotas,
      frecuenciaCuota: venta.frecuenciaCuota,
      fechaPrimeraCuota: venta.fechaPrimeraCuota,
      // Campos de amortización
      tasaInteres: venta.tasaInteres,
      montoIntereses: venta.montoIntereses,
      montoCapital: venta.montoCapital,
      saldoCapital: venta.saldoCapital,
      // Cuotas con datos de amortización
      cuotas: venta.cuotas.map((cuota: any) => ({
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        monto: cuota.monto,
        fechaVencimiento: cuota.fechaVencimiento,
        estado: cuota.estado,
        // Datos de amortización de la cuota
        montoCapital: cuota.montoCapital,
        montoInteres: cuota.montoInteres,
        saldoCapitalAnterior: cuota.saldoCapitalAnterior,
        saldoCapitalPosterior: cuota.saldoCapitalPosterior
      }))
    }

    return NextResponse.json({
      venta: datosAmortizacion,
      tieneDatosAmortizacion: !!(venta.tasaInteres && venta.tasaInteres > 0),
      tieneCuotasConAmortizacion: venta.cuotas.some((c: any) => c.montoCapital || c.montoInteres)
    })

  } catch (error) {
    console.error('Error al obtener datos de amortización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 