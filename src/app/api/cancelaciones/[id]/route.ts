import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoCancelacion, EstadoVentaLote, EstadoVentaUnidadCementerio, EstadoLote, EstadoUnidadCementerio } from '@prisma/client'

// GET /api/cancelaciones/[id] - Obtener cancelación específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cancelacion = await prisma.cancelacionVenta.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true,
            proyecto: true,
            vendedor: true,
            comprobantesPago: true,
            cuotas: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true,
            proyecto: true,
            vendedor: true,
            comprobantesPago: true,
            cuotas: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    if (!cancelacion) {
      return NextResponse.json(
        { error: 'Cancelación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(cancelacion)
  } catch (error) {
    console.error('Error al obtener cancelación:', error)
    return NextResponse.json(
      { error: 'Error al obtener cancelación' },
      { status: 500 }
    )
  }
}

// PATCH /api/cancelaciones/[id] - Actualizar estado de cancelación
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para aprobar/rechazar cancelaciones
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'FINANCE_MANAGER'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para aprobar cancelaciones' }, { status: 403 })
    }

    const body = await request.json()
    const { accion, observaciones } = body

    if (!accion || !['aprobar', 'rechazar', 'completar'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser: aprobar, rechazar o completar' },
        { status: 400 }
      )
    }

    const cancelacion = await prisma.cancelacionVenta.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: true,
        ventaUnidadCementerio: true
      }
    })

    if (!cancelacion) {
      return NextResponse.json(
        { error: 'Cancelación no encontrada' },
        { status: 404 }
      )
    }

    let nuevoEstado: EstadoCancelacion
    let estadoVenta: EstadoVentaLote | EstadoVentaUnidadCementerio

    switch (accion) {
      case 'aprobar':
        nuevoEstado = EstadoCancelacion.APROBADA
        estadoVenta = cancelacion.ventaLoteId 
          ? EstadoVentaLote.EN_PROCESO_CANCELACION 
          : EstadoVentaUnidadCementerio.EN_PROCESO_CANCELACION
        break
      
      case 'rechazar':
        nuevoEstado = EstadoCancelacion.RECHAZADA
        // Revertir el estado de la venta a su estado anterior
        estadoVenta = cancelacion.ventaLoteId 
          ? EstadoVentaLote.APROBADA 
          : EstadoVentaUnidadCementerio.APROBADA
        break
      
      case 'completar':
        nuevoEstado = EstadoCancelacion.COMPLETADA
        estadoVenta = cancelacion.ventaLoteId 
          ? EstadoVentaLote.CANCELADA 
          : EstadoVentaUnidadCementerio.CANCELADA
        break
      
      default:
        return NextResponse.json(
          { error: 'Acción inválida' },
          { status: 400 }
        )
    }

    // Actualizar la cancelación
    const cancelacionActualizada = await prisma.cancelacionVenta.update({
      where: { id: params.id },
      data: {
        estado: nuevoEstado,
        fechaAprobacion: accion === 'aprobar' ? new Date() : undefined,
        fechaCompletada: accion === 'completar' ? new Date() : undefined,
        observaciones: observaciones || cancelacion.observaciones,
        aprobadoPor: accion === 'aprobar' ? session.user.id : cancelacion.aprobadoPor,
        updatedBy: session.user.id
      },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true,
            proyecto: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true,
            proyecto: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    // Actualizar el estado de la venta
    if (cancelacion.ventaLoteId) {
      await prisma.ventaLote.update({
        where: { id: cancelacion.ventaLoteId },
        data: { estado: estadoVenta as EstadoVentaLote }
      })

      // Si se completa la cancelación, liberar el lote
      if (accion === 'completar') {
        await prisma.lote.update({
          where: { id: cancelacion.ventaLote!.loteId },
          data: { estado: EstadoLote.DISPONIBLE }
        })
      }
    } else if (cancelacion.ventaUnidadCementerioId) {
      await prisma.ventaUnidadCementerio.update({
        where: { id: cancelacion.ventaUnidadCementerioId },
        data: { estado: estadoVenta as EstadoVentaUnidadCementerio }
      })

      // Si se completa la cancelación, liberar la unidad de cementerio
      if (accion === 'completar') {
        await prisma.unidadCementerio.update({
          where: { id: cancelacion.ventaUnidadCementerio!.unidadCementerioId },
          data: { estado: EstadoUnidadCementerio.DISPONIBLE }
        })
      }
    }

    return NextResponse.json(cancelacionActualizada)
  } catch (error) {
    console.error('Error al actualizar cancelación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cancelación' },
      { status: 500 }
    )
  }
} 