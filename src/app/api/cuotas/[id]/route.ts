import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoCuota } from '@prisma/client'

// Definir roles permitidos para gestión de cuotas
const CUOTAS_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'FINANCE_MANAGER',
  'ACCOUNTANT'
]

// GET /api/cuotas/[id] - Obtener información de una cuota específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver cuotas' }, { status: 403 })
    }

    // Obtener la cuota con información de la venta
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id },
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
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            vendedor: true,
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
      }
    })

    if (!cuota) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    // Verificar permisos específicos para Sales Rep
    if (userRole === 'SALES_REP') {
      const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
      if (venta?.vendedor?.id !== session.user.id) {
        return NextResponse.json({ error: 'No tienes permisos para ver esta cuota' }, { status: 403 })
      }
    }

    return NextResponse.json({
      id: cuota.id,
      numeroCuota: cuota.numeroCuota,
      monto: cuota.monto,
      fechaVencimiento: cuota.fechaVencimiento,
      fechaPago: cuota.fechaPago,
      montoPagado: cuota.montoPagado,
      estado: cuota.estado,
      observaciones: cuota.observaciones,
      ventaLoteId: cuota.ventaLoteId,
      ventaUnidadCementerioId: cuota.ventaUnidadCementerioId,
      ventaLote: cuota.ventaLote,
      ventaUnidadCementerio: cuota.ventaUnidadCementerio
    })

  } catch (error) {
    console.error('Error al obtener cuota:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/cuotas/[id] - Actualizar cuota
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para actualizar cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar cuotas' }, { status: 403 })
    }

    const body = await request.json()
    const {
      estado,
      fechaPago,
      montoPagado,
      fechaVencimiento,
      observaciones
    } = body

    // Verificar que la cuota existe
    const cuotaExistente = await prisma.cuota.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          include: {
            vendedor: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            vendedor: true
          }
        }
      }
    })

    if (!cuotaExistente) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    // Verificar permisos específicos para Sales Rep
    if (userRole === 'SALES_REP') {
      const venta = cuotaExistente.ventaLote || cuotaExistente.ventaUnidadCementerio
      if (venta?.vendedor?.id !== session.user.id) {
        return NextResponse.json({ error: 'No tienes permisos para actualizar esta cuota' }, { status: 403 })
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedBy: session.user.id
    }

    // Actualizar estado si se proporciona
    if (estado) {
      updateData.estado = estado
    }

    // Actualizar fecha de pago si se proporciona
    if (fechaPago) {
      updateData.fechaPago = new Date(fechaPago)
    }

    // Actualizar monto pagado si se proporciona
    if (montoPagado !== undefined) {
      updateData.montoPagado = parseFloat(montoPagado)
      
      // Si el monto pagado es igual o mayor al monto de la cuota, marcar como pagada
      if (updateData.montoPagado >= cuotaExistente.monto) {
        updateData.estado = EstadoCuota.PAGADA
        if (!updateData.fechaPago) {
          updateData.fechaPago = new Date()
        }
      } else if (updateData.montoPagado > 0) {
        updateData.estado = EstadoCuota.PARCIAL
      }
    }

    // Actualizar fecha de vencimiento si se proporciona
    if (fechaVencimiento) {
      updateData.fechaVencimiento = new Date(fechaVencimiento)
    }

    // Actualizar observaciones si se proporciona
    if (observaciones !== undefined) {
      updateData.observaciones = observaciones
    }

    // Actualizar la cuota
    const cuotaActualizada = await prisma.cuota.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(cuotaActualizada)

  } catch (error) {
    console.error('Error al actualizar cuota:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cuotas/[id] - Eliminar cuota
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Solo administradores y managers pueden eliminar cuotas
    const canDelete = ['SUPER_ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER'].includes(userRole)
    if (!canDelete) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar cuotas' }, { status: 403 })
    }

    // Verificar que la cuota existe
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id }
    })

    if (!cuota) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    // Eliminar la cuota
    await prisma.cuota.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Cuota eliminada correctamente' })

  } catch (error) {
    console.error('Error al eliminar cuota:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 