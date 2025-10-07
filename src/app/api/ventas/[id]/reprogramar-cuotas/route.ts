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
    const {
      cuotasModificadas,
      descuentosAplicados,
      cambiosPlan,
      motivoReprogramacion
    } = await request.json()

    console.log('🔍 API Reprogramación - Datos recibidos:', {
      ventaId,
      cuotasModificadas,
      descuentosAplicados,
      cambiosPlan,
      motivoReprogramacion
    })

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

    // Verificar que la venta esté aprobada
    if (venta.estado !== 'APROBADA') {
      return NextResponse.json({ 
        error: `No se puede reprogramar una venta en estado "${venta.estado}". La venta debe estar APROBADA.` 
      }, { status: 400 })
    }

    // Verificar que no haya cuotas pagadas completamente
    const cuotasPagadas = venta.cuotas.filter((cuota: any) => 
      cuota.estado === 'PAGADA' || cuota.montoPagado >= cuota.monto
    )

    if (cuotasPagadas.length > 0) {
      return NextResponse.json({ 
        error: `No se puede reprogramar porque hay ${cuotasPagadas.length} cuota(s) ya pagada(s). Solo se pueden modificar cuotas pendientes.` 
      }, { status: 400 })
    }

    // Crear registro de reprogramación
    const reprogramacion = await prisma.reprogramacionCuotas.create({
      data: {
        ventaLoteId: tipoVenta === 'LOTE' ? ventaId : null,
        ventaUnidadCementerioId: tipoVenta === 'UNIDAD_CEMENTERIO' ? ventaId : null,
        motivo: motivoReprogramacion || 'Reprogramación de cuotas',
        cambiosPlan: cambiosPlan || {},
        createdBy: session.user.id
      }
    })

    console.log('✅ Registro de reprogramación creado:', reprogramacion.id)

    // Procesar cambios de plan si existen
    if (cambiosPlan) {
      await procesarCambiosPlan(venta, cambiosPlan, tipoVenta, session.user.id)
    }

    // Procesar descuentos aplicados
    if (descuentosAplicados && descuentosAplicados.length > 0) {
      await procesarDescuentos(venta, descuentosAplicados, reprogramacion.id, session.user.id)
    }

    // Procesar cuotas modificadas
    if (cuotasModificadas && cuotasModificadas.length > 0) {
      await procesarCuotasModificadas(venta, cuotasModificadas, reprogramacion.id, session.user.id)
    }

    // Recalcular amortización si hay cambios de plan
    if (cambiosPlan && (cambiosPlan.modeloAmortizacion || cambiosPlan.tasaInteres || cambiosPlan.frecuenciaCuota)) {
      await recalcularAmortizacion(venta, cambiosPlan, tipoVenta, session.user.id)
    }

    // Obtener venta actualizada
    const ventaActualizada = await prisma[tipoVenta === 'LOTE' ? 'ventaLote' : 'ventaUnidadCementerio'].findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: { numeroCuota: 'asc' }
        },
        reprogramaciones: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json({
      message: 'Cuotas reprogramadas correctamente',
      reprogramacion: {
        id: reprogramacion.id,
        motivo: reprogramacion.motivo,
        fecha: reprogramacion.createdAt
      },
      venta: ventaActualizada
    })

  } catch (error) {
    console.error('Error al reprogramar cuotas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para procesar cambios de plan
async function procesarCambiosPlan(venta: any, cambiosPlan: any, tipoVenta: string, userId: string) {
  const datosActualizacion: any = {}

  if (cambiosPlan.modeloAmortizacion) {
    datosActualizacion.modeloAmortizacion = cambiosPlan.modeloAmortizacion
  }

  if (cambiosPlan.tasaInteres) {
    datosActualizacion.tasaInteres = cambiosPlan.tasaInteres
  }

  if (cambiosPlan.frecuenciaCuota) {
    datosActualizacion.frecuenciaCuota = cambiosPlan.frecuenciaCuota
  }

  if (Object.keys(datosActualizacion).length > 0) {
    await prisma[tipoVenta === 'LOTE' ? 'ventaLote' : 'ventaUnidadCementerio'].update({
      where: { id: venta.id },
      data: datosActualizacion
    })

    console.log('✅ Cambios de plan aplicados:', datosActualizacion)
  }
}

// Función para procesar descuentos
async function procesarDescuentos(venta: any, descuentosAplicados: any[], reprogramacionId: string, userId: string) {
  for (const descuento of descuentosAplicados) {
    const cuota = venta.cuotas.find((c: any) => c.numeroCuota === descuento.numeroCuota)
    
    if (cuota && cuota.estado !== 'PAGADA') {
      // Crear registro de descuento
      await prisma.descuentoCuota.create({
        data: {
          cuotaId: cuota.id,
          reprogramacionId: reprogramacionId,
          montoDescuento: descuento.montoDescuento,
          motivo: descuento.motivo,
          createdBy: userId
        }
      })

      // Actualizar monto de la cuota
      const nuevoMonto = Math.max(0, cuota.monto - descuento.montoDescuento)
      await prisma.cuota.update({
        where: { id: cuota.id },
        data: { monto: nuevoMonto }
      })

      console.log(`✅ Descuento aplicado a cuota ${descuento.numeroCuota}: ${descuento.montoDescuento}`)
    }
  }
}

// Función para procesar cuotas modificadas
async function procesarCuotasModificadas(venta: any, cuotasModificadas: any[], reprogramacionId: string, userId: string) {
  for (const cuotaMod of cuotasModificadas) {
    const cuota = venta.cuotas.find((c: any) => c.numeroCuota === cuotaMod.numeroCuota)
    
    if (cuota && cuota.estado !== 'PAGADA') {
      // Crear registro de modificación
      await prisma.modificacionCuota.create({
        data: {
          cuotaId: cuota.id,
          reprogramacionId: reprogramacionId,
          montoAnterior: cuota.monto,
          montoNuevo: cuotaMod.monto,
          fechaVencimientoAnterior: cuota.fechaVencimiento,
          fechaVencimientoNueva: new Date(cuotaMod.fechaVencimiento),
          createdBy: userId
        }
      })

      // Actualizar cuota
      await prisma.cuota.update({
        where: { id: cuota.id },
        data: {
          monto: cuotaMod.monto,
          fechaVencimiento: new Date(cuotaMod.fechaVencimiento)
        }
      })

      console.log(`✅ Cuota ${cuotaMod.numeroCuota} modificada: ${cuota.monto} → ${cuotaMod.monto}`)
    }
  }
}

// Función para recalcular amortización
async function recalcularAmortizacion(venta: any, cambiosPlan: any, tipoVenta: string, userId: string) {
  const cuotasPendientes = venta.cuotas.filter((cuota: any) => 
    cuota.estado !== 'PAGADA' && cuota.montoPagado < cuota.monto
  )

  if (cuotasPendientes.length === 0) return

  // Calcular saldo pendiente
  const saldoPendiente = cuotasPendientes.reduce((total: number, cuota: any) => {
    return total + (cuota.monto - (cuota.montoPagado || 0))
  }, 0)

  // Calcular nueva amortización
  const amortizacion = AmortizacionService.calcularAmortizacion(
    saldoPendiente,
    cambiosPlan.tasaInteres || venta.tasaInteres || 0,
    cuotasPendientes.length,
    cambiosPlan.frecuenciaCuota || venta.frecuenciaCuota || 'MENSUAL',
    new Date(),
    cambiosPlan.modeloAmortizacion || venta.modeloAmortizacion || 'FRANCES'
  )

  // Actualizar cuotas pendientes
  for (let i = 0; i < cuotasPendientes.length; i++) {
    const cuota = cuotasPendientes[i]
    const cuotaAmortizacion = amortizacion.tablaAmortizacion[i]

    if (cuotaAmortizacion) {
      await prisma.cuota.update({
        where: { id: cuota.id },
        data: {
          monto: cuotaAmortizacion.montoCuota,
          montoCapital: cuotaAmortizacion.montoCapital,
          montoInteres: cuotaAmortizacion.montoInteres,
          saldoCapitalAnterior: cuotaAmortizacion.saldoCapital,
          saldoCapitalPosterior: cuotaAmortizacion.saldoCapitalPosterior
        }
      })
    }
  }

  console.log('✅ Amortización recalculada para cuotas pendientes')
}
