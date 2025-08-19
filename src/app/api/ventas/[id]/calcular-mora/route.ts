import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    const { tasaMoraAnual } = await request.json()
    const ventaId = params.id

    if (!tasaMoraAnual || tasaMoraAnual <= 0) {
      return NextResponse.json({ error: 'Tasa de mora inválida' }, { status: 400 })
    }

    // Buscar la venta (lote o unidad de cementerio)
    const ventaLote = await prisma.ventaLote.findUnique({
      where: { id: ventaId }
    })

    const ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: ventaId }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Obtener todas las cuotas de la venta
    const cuotas = await prisma.cuota.findMany({
      where: {
        OR: [
          { ventaLoteId: ventaLote?.id },
          { ventaUnidadCementerioId: ventaUnidadCementerio?.id }
        ]
      },
      orderBy: { numeroCuota: 'asc' }
    })

    if (cuotas.length === 0) {
      return NextResponse.json({ error: 'No se encontraron cuotas para esta venta' }, { status: 404 })
    }

    const fechaActual = new Date()
    let totalMora = 0
    const cuotasConMora = []

    // Calcular intereses por mora para cada cuota vencida
    for (const cuota of cuotas) {
      const fechaVencimiento = new Date(cuota.fechaVencimiento)
      const montoPendiente = cuota.monto - (cuota.montoPagado || 0)

      // Solo calcular mora si la cuota está vencida y tiene saldo pendiente
      if (fechaVencimiento < fechaActual && montoPendiente > 0) {
        const diasVencidos = Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diasVencidos > 0) {
          // Calcular interés por mora (interés diario)
          const tasaMoraDiaria = tasaMoraAnual / 365 / 100
          const interesMora = montoPendiente * tasaMoraDiaria * diasVencidos
          
          totalMora += interesMora
          
          cuotasConMora.push({
            numeroCuota: cuota.numeroCuota,
            diasVencidos,
            montoPendiente,
            interesMora: Math.round(interesMora * 100) / 100
          })

          // Actualizar la cuota con el interés por mora
          await prisma.cuota.update({
            where: { id: cuota.id },
            data: {
              interesMora: Math.round(interesMora * 100) / 100,
              diasVencidos: diasVencidos,
              updatedBy: session.user.id
            }
          })
        }
      } else {
        // Limpiar intereses por mora si la cuota ya no está vencida
        if (cuota.interesMora && cuota.interesMora > 0) {
          await prisma.cuota.update({
            where: { id: cuota.id },
            data: {
              interesMora: 0,
              diasVencidos: 0,
              updatedBy: session.user.id
            }
          })
        }
      }
    }

    // Actualizar la venta con la tasa de mora
    if (ventaLote) {
      await prisma.ventaLote.update({
        where: { id: ventaLote.id },
        data: {
          tasaMora: tasaMoraAnual,
          updatedBy: session.user.id
        }
      })
    } else if (ventaUnidadCementerio) {
      await prisma.ventaUnidadCementerio.update({
        where: { id: ventaUnidadCementerio.id },
        data: {
          tasaMora: tasaMoraAnual,
          updatedBy: session.user.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Intereses por mora calculados correctamente',
      totalMora: Math.round(totalMora * 100) / 100,
      cuotasConMora,
      tasaMoraAnual
    })

  } catch (error) {
    console.error('Error al calcular intereses por mora:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
