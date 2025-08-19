import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const {
      precioVenta,
      tipoVenta,
      numeroCuotas,
      montoCuota,
      frecuenciaCuota,
      formaPago,
      montoInicial,
      observaciones,
    } = body

    // Verificar que la reserva existe y está en estado válido
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        proyecto: true,
        lote: true,
        unidadCementerio: true,
        cliente: true,
        vendedor: true,
      }
    })

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    if (reserva.estado === 'CONVERTIDA') {
      return NextResponse.json(
        { error: 'La reserva ya ha sido convertida a venta' },
        { status: 400 }
      )
    }

    if (reserva.estado === 'CANCELADA' || reserva.estado === 'EXPIRADA') {
      return NextResponse.json(
        { error: 'No se puede convertir una reserva cancelada o expirada' },
        { status: 400 }
      )
    }

    // Validar que el lote o unidad aún esté disponible
    if (reserva.loteId) {
      const lote = await prisma.lote.findUnique({
        where: { id: reserva.loteId }
      })
      if (!lote || lote.estado !== 'DISPONIBLE') {
        return NextResponse.json(
          { error: 'El lote ya no está disponible' },
          { status: 400 }
        )
      }
    }

    if (reserva.unidadCementerioId) {
      const unidad = await prisma.unidadCementerio.findUnique({
        where: { id: reserva.unidadCementerioId }
      })
      if (!unidad || unidad.estado !== 'DISPONIBLE') {
        return NextResponse.json(
          { error: 'La unidad ya no está disponible' },
          { status: 400 }
        )
      }
    }

    // Crear la venta usando una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Generar número de venta
      const fecha = new Date()
      const numeroVenta = `VEN-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

      let venta

      if (reserva.loteId) {
        // Crear venta de lote
        venta = await tx.ventaLote.create({
          data: {
            loteId: reserva.loteId,
            manzanaId: reserva.lote!.manzanaId,
            proyectoId: reserva.proyectoId,
            clienteId: reserva.clienteId,
            vendedorId: reserva.vendedorId,
            fechaVenta: new Date(),
            precioOriginal: reserva.lote!.precio || 0,
            precioVenta: parseFloat(precioVenta),
            tipoVenta,
            numeroCuotas: numeroCuotas ? parseInt(numeroCuotas) : 1,
            montoCuota: montoCuota ? parseFloat(montoCuota) : undefined,
            frecuenciaCuota,
            formaPago,
            montoInicial: montoInicial ? parseFloat(montoInicial) : 0,
            saldoPendiente: parseFloat(precioVenta) - (montoInicial ? parseFloat(montoInicial) : 0),
            observaciones,
            estado: 'PENDIENTE',
            createdBy: session.user.id,
          }
        })

        // Actualizar estado del lote
        await tx.lote.update({
          where: { id: reserva.loteId },
          data: { estado: 'RESERVADO' }
        })
      } else if (reserva.unidadCementerioId) {
        // Crear venta de unidad de cementerio
        venta = await tx.ventaUnidadCementerio.create({
          data: {
            unidadCementerioId: reserva.unidadCementerioId,
            pabellonId: reserva.unidadCementerio!.pabellonId,
            proyectoId: reserva.proyectoId,
            clienteId: reserva.clienteId,
            vendedorId: reserva.vendedorId,
            fechaVenta: new Date(),
            precioOriginal: reserva.unidadCementerio!.precio,
            precioVenta: parseFloat(precioVenta),
            tipoVenta,
            numeroCuotas: numeroCuotas ? parseInt(numeroCuotas) : 1,
            montoCuota: montoCuota ? parseFloat(montoCuota) : undefined,
            frecuenciaCuota,
            formaPago,
            montoInicial: montoInicial ? parseFloat(montoInicial) : 0,
            saldoPendiente: parseFloat(precioVenta) - (montoInicial ? parseFloat(montoInicial) : 0),
            observaciones,
            estado: 'PENDIENTE',
            createdBy: session.user.id,
          }
        })

        // Actualizar estado de la unidad
        await tx.unidadCementerio.update({
          where: { id: reserva.unidadCementerioId },
          data: { estado: 'RESERVADO' }
        })
      }

      // Actualizar la reserva como convertida
      const reservaActualizada = await tx.reserva.update({
        where: { id },
        data: {
          estado: 'CONVERTIDA',
          ventaId: venta!.id,
          updatedBy: session.user.id,
        },
        include: {
          proyecto: true,
          lote: true,
          unidadCementerio: true,
          cliente: true,
          vendedor: true,
          venta: {
            select: {
              id: true,
              precioVenta: true,
              estado: true,
              fechaVenta: true,
            }
          },
        }
      })

      return { venta, reserva: reservaActualizada }
    })

    return NextResponse.json({
      message: 'Reserva convertida a venta exitosamente',
      venta: result.venta,
      reserva: result.reserva
    })

  } catch (error) {
    console.error('Error al convertir reserva a venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 