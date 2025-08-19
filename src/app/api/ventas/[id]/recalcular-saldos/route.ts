import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Función para recalcular saldos de capital de todas las cuotas de una venta
async function recalcularSaldosCapital(ventaId: string, ventaLoteId?: string, ventaUnidadCementerioId?: string) {
  try {
    // Obtener todas las cuotas ordenadas por número
    const cuotas = await prisma.cuota.findMany({
      where: {
        OR: [
          { ventaLoteId: ventaLoteId || undefined },
          { ventaUnidadCementerioId: ventaUnidadCementerioId || undefined }
        ]
      },
      orderBy: { numeroCuota: 'asc' }
    })
    
    if (cuotas.length === 0) {
      return { success: false, message: 'No se encontraron cuotas para esta venta' }
    }
    
    // Obtener el saldo inicial de la venta
    const ventaLote = ventaLoteId ? await prisma.ventaLote.findUnique({
      where: { id: ventaLoteId },
      select: { precioVenta: true, montoInicial: true, saldoCapital: true }
    }) : null
    
    const ventaUnidad = ventaUnidadCementerioId ? await prisma.ventaUnidadCementerio.findUnique({
      where: { id: ventaUnidadCementerioId },
      select: { precioVenta: true, montoInicial: true, saldoCapital: true }
    }) : null
    
    const venta = ventaLote || ventaUnidad
    if (!venta) {
      return { success: false, message: 'No se encontró la venta' }
    }
    
    // Usar saldoCapital si existe, sino calcular
    const saldoFinanciar = venta.saldoCapital || ((venta.precioVenta || 0) - (venta.montoInicial || 0))
    let saldoActual = saldoFinanciar
    
    const resultados = []
    
    // Recalcular saldos para cada cuota
    for (let i = 0; i < cuotas.length; i++) {
      const cuota = cuotas[i]
      const esUltimaCuota = i === cuotas.length - 1
      
      // Calcular saldo posterior
      const saldoPosterior = esUltimaCuota ? 0 : Math.max(0, saldoActual - (cuota.montoCapital || 0))
      
      // Actualizar la cuota
      const cuotaActualizada = await prisma.cuota.update({
        where: { id: cuota.id },
        data: {
          saldoCapitalAnterior: saldoActual,
          saldoCapitalPosterior: saldoPosterior
        }
      })
      
      resultados.push({
        numeroCuota: cuota.numeroCuota,
        saldoAnterior: saldoActual,
        saldoPosterior: saldoPosterior,
        montoCapital: cuota.montoCapital
      })
      
      // Actualizar saldo para la siguiente cuota
      saldoActual = saldoPosterior
    }
    
    return { 
      success: true, 
      message: 'Saldos recalculados correctamente',
      resultados,
      saldoInicial: saldoFinanciar
    }
  } catch (error) {
    console.error('Error al recalcular saldos:', error)
    return { success: false, message: 'Error al recalcular saldos', error: error.message }
  }
}

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

    // Recalcular saldos
    const resultado = await recalcularSaldosCapital(
      ventaId,
      ventaLote?.id,
      ventaUnidadCementerio?.id
    )

    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }

  } catch (error) {
    console.error('Error en recalcular saldos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
