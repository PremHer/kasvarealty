import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { AmortizacionService } from '@/lib/services/amortizacionService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const ventaId = params.id
    const { tasaInteresAnual } = await request.json()

    // Buscar la venta
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' }
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
          }
        }
      })
      tipoVenta = 'UNIDAD_CEMENTERIO'
      venta = ventaUnidad
    }

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Verificar si ya tiene datos de amortización
    if (venta.tasaInteres && venta.tasaInteres > 0) {
      return NextResponse.json({ 
        message: 'La venta ya tiene datos de amortización calculados',
        venta 
      })
    }

    // Calcular amortización
    const amortizacion = AmortizacionService.calcularAmortizacion(
      venta.saldoPendiente || venta.precioVenta,
      tasaInteresAnual || 0,
      venta.numeroCuotas || 1,
      venta.fechaPrimeraCuota || new Date(),
      venta.frecuenciaCuota || 'MENSUAL'
    )

    // Actualizar la venta con los datos de amortización
    const datosActualizacion = {
      tasaInteres: tasaInteresAnual,
      montoIntereses: amortizacion.totalIntereses,
      montoCapital: venta.saldoPendiente || venta.precioVenta,
      saldoCapital: venta.saldoPendiente || venta.precioVenta
    }

    if (tipoVenta === 'LOTE') {
      await prisma.ventaLote.update({
        where: { id: ventaId },
        data: datosActualizacion
      })
    } else {
      await prisma.ventaUnidadCementerio.update({
        where: { id: ventaId },
        data: datosActualizacion
      })
    }

    // Actualizar las cuotas con los datos de amortización
    for (let i = 0; i < amortizacion.tablaAmortizacion.length; i++) {
      const cuotaAmortizacion = amortizacion.tablaAmortizacion[i]
      const cuotaExistente = venta.cuotas[i]

      if (cuotaExistente) {
        const datosCuota = {
          montoCapital: cuotaAmortizacion.montoCapital,
          montoInteres: cuotaAmortizacion.montoInteres,
          saldoCapitalAnterior: cuotaAmortizacion.saldoCapital,
          saldoCapitalPosterior: cuotaAmortizacion.saldoCapitalPosterior
        }

        await prisma.cuota.update({
          where: { id: cuotaExistente.id },
          data: datosCuota
        })
      }
    }

    return NextResponse.json({
      message: 'Amortización calculada y actualizada correctamente',
      amortizacion,
      venta: {
        ...venta,
        ...datosActualizacion
      }
    })

  } catch (error) {
    console.error('Error al calcular amortización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 