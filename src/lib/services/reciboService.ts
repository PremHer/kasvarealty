import { prisma } from '@/lib/prisma'
import { FormaPago } from '@prisma/client'

interface GenerarReciboData {
  ventaId?: string
  cuotaId?: string
  clienteId: string
  vendedorId: string
  montoPagado: number
  formaPago: FormaPago
  metodoPago?: string
  concepto: string
  fechaPago?: Date
  observaciones?: string
  comprobantePagoId?: string
  empresaDesarrolladoraId: string
  createdBy: string
}

// Función para generar número de recibo correlativo
async function generarNumeroRecibo(empresaId: string): Promise<string> {
  const fecha = new Date()
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  
  // Buscar el último recibo de la empresa en este año/mes
  const ultimoRecibo = await prisma.reciboPago.findFirst({
    where: {
      empresaDesarrolladoraId: empresaId,
      numeroRecibo: {
        startsWith: `R${año}${mes}`
      }
    },
    orderBy: {
      numeroRecibo: 'desc'
    }
  })

  let correlativo = 1
  if (ultimoRecibo) {
    const ultimoCorrelativo = parseInt(ultimoRecibo.numeroRecibo.slice(-4))
    correlativo = ultimoCorrelativo + 1
  }

  return `R${año}${mes}${String(correlativo).padStart(4, '0')}`
}

export async function generarReciboAutomatico(data: GenerarReciboData) {
  try {
    // Generar número de recibo
    const numeroRecibo = await generarNumeroRecibo(data.empresaDesarrolladoraId)

    // Crear el recibo
    const recibo = await prisma.reciboPago.create({
      data: {
        numeroRecibo,
        empresaDesarrolladoraId: data.empresaDesarrolladoraId,
        ventaId: data.ventaId || null,
        cuotaId: data.cuotaId || null,
        clienteId: data.clienteId,
        vendedorId: data.vendedorId,
        montoPagado: data.montoPagado,
        formaPago: data.formaPago,
        metodoPago: data.metodoPago,
        concepto: data.concepto,
        fechaPago: data.fechaPago || new Date(),
        observaciones: data.observaciones,
        comprobantePagoId: data.comprobantePagoId || null,
        createdBy: data.createdBy,
      },
      include: {
        empresaDesarrolladora: {
          include: {
            representanteLegal: true
          }
        },
        venta: {
          include: {
            lote: true,
            proyecto: true
          }
        },
        cuota: true,
        cliente: true,
        vendedor: true,
        comprobantePago: true,
        creadoPorUsuario: true,
      }
    })

    return recibo
  } catch (error) {
    console.error('Error al generar recibo automático:', error)
    throw error
  }
}

// Función para generar recibo de pago de venta al contado
export async function generarReciboVentaContado(
  ventaId: string,
  montoPagado: number,
  formaPago: FormaPago,
  empresaDesarrolladoraId: string,
  createdBy: string,
  metodoPago?: string,
  observaciones?: string,
  comprobantePagoId?: string
) {
  try {
    // Obtener información de la venta
    const venta = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cliente: true,
        vendedor: true,
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
      throw new Error('Venta no encontrada')
    }

    const concepto = `Pago de venta al contado - Lote ${venta.lote.numero} - ${venta.lote.manzana.proyecto.nombre}`

    return await generarReciboAutomatico({
      ventaId,
      clienteId: venta.clienteId,
      vendedorId: venta.vendedorId,
      montoPagado,
      formaPago,
      metodoPago,
      concepto,
      observaciones,
      comprobantePagoId,
      empresaDesarrolladoraId,
      createdBy,
    })
  } catch (error) {
    console.error('Error al generar recibo de venta al contado:', error)
    throw error
  }
}

// Función para generar recibo de pago de cuota
export async function generarReciboCuota(
  cuotaId: string,
  montoPagado: number,
  formaPago: FormaPago,
  empresaDesarrolladoraId: string,
  createdBy: string,
  metodoPago?: string,
  observaciones?: string,
  comprobantePagoId?: string
) {
  try {
    // Obtener información de la cuota
    const cuota = await prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            vendedor: true,
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
        }
      }
    })

    if (!cuota) {
      throw new Error('Cuota no encontrada')
    }

    if (!cuota.ventaLote) {
      throw new Error('Venta de lote no encontrada para esta cuota')
    }

    const concepto = `Pago de cuota ${cuota.numeroCuota} - Lote ${cuota.ventaLote.lote.numero} - ${cuota.ventaLote.lote.manzana.proyecto.nombre}`

    return await generarReciboAutomatico({
      cuotaId,
      ventaId: cuota.ventaLoteId || undefined,
      clienteId: cuota.ventaLote.clienteId,
      vendedorId: cuota.ventaLote.vendedorId,
      montoPagado,
      formaPago,
      metodoPago,
      concepto,
      observaciones,
      comprobantePagoId,
      empresaDesarrolladoraId,
      createdBy,
    })
  } catch (error) {
    console.error('Error al generar recibo de cuota:', error)
    throw error
  }
}

// Función para generar recibo de pago inicial
export async function generarReciboPagoInicial(
  ventaId: string,
  montoPagado: number,
  formaPago: FormaPago,
  empresaDesarrolladoraId: string,
  createdBy: string,
  metodoPago?: string,
  observaciones?: string,
  comprobantePagoId?: string
) {
  try {
    // Obtener información de la venta
    const venta = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cliente: true,
        vendedor: true,
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
      throw new Error('Venta no encontrada')
    }

    const concepto = `Pago inicial - Lote ${venta.lote.numero} - ${venta.lote.manzana.proyecto.nombre}`

    return await generarReciboAutomatico({
      ventaId,
      clienteId: venta.clienteId,
      vendedorId: venta.vendedorId,
      montoPagado,
      formaPago,
      metodoPago,
      concepto,
      observaciones,
      comprobantePagoId,
      empresaDesarrolladoraId,
      createdBy,
    })
  } catch (error) {
    console.error('Error al generar recibo de pago inicial:', error)
    throw error
  }
} 