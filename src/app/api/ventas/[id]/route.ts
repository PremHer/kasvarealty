import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para ventas
const SALES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'GERENTE_GENERAL'
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver ventas' }, { status: 403 })
    }

    const ventaId = params.id

    // Buscar venta de lote
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: ventaId },
      include: {
        cliente: {
          include: {
            direcciones: true
          }
        },
        vendedor: true,
        aprobador: true,
        lote: {
          include: {
            manzana: {
              include: {
                proyecto: true
              }
            }
          }
        },
        cuotas: {
          orderBy: { numeroCuota: 'asc' }
        }
      }
    })

    // Si no es venta de lote, buscar venta de unidad de cementerio
    if (!ventaLote) {
      const ventaUnidad = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId },
        include: {
          cliente: {
            include: {
              direcciones: true
            }
          },
          vendedor: true,
          aprobador: true,
          unidadCementerio: {
            include: {
              pabellon: {
                include: {
                  proyecto: true
                }
              }
            }
          },
          cuotas: {
            orderBy: { numeroCuota: 'asc' }
          }
        }
      })

      if (!ventaUnidad) {
        return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
      }

      // Agregar tipo de venta para identificar
      const ventaConTipo = {
        ...ventaUnidad,
        tipoVenta: 'UNIDAD_CEMENTERIO'
      }

      return NextResponse.json(ventaConTipo)
    }

    // Agregar tipo de venta para identificar
    const ventaConTipo = {
      ...ventaLote,
      tipoVenta: 'LOTE'
    }

    return NextResponse.json(ventaConTipo)

  } catch (error) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/ventas/[id] - Eliminar venta
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
    
    // Verificar si el usuario tiene permisos para eliminar ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar ventas' }, { status: 403 })
    }

    console.log('🔍 API Eliminar Venta - Usuario:', session.user.email)
    console.log('🔍 API Eliminar Venta - Rol del usuario:', userRole)
    console.log('🔍 API Eliminar Venta - ID de venta:', params.id)

    // Buscar la venta en ambas tablas
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
      include: {
        cuotas: true,
        comprobantesPago: true,
        contratos: true,
        pagosComisiones: true,
        cancelaciones: true
      }
    })

    let ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      include: {
        cuotas: true,
        comprobantesPago: true,
        contratos: true,
        pagosComisiones: true,
        cancelaciones: true
      }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      console.log('❌ API Eliminar Venta - Venta no encontrada')
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo puede eliminar sus propias ventas
      if (ventaLote && ventaLote.vendedorId !== session.user.id) {
        console.log('❌ API Eliminar Venta - Sales Rep sin permisos para esta venta')
        return NextResponse.json(
          { error: 'No tienes permisos para eliminar esta venta' },
          { status: 403 }
        )
      }
      if (ventaUnidadCementerio && ventaUnidadCementerio.vendedorId !== session.user.id) {
        console.log('❌ API Eliminar Venta - Sales Rep sin permisos para esta venta')
        return NextResponse.json(
          { error: 'No tienes permisos para eliminar esta venta' },
          { status: 403 }
        )
      }
    }

    // Verificar si la venta tiene datos asociados que impidan la eliminación
    const venta = ventaLote || ventaUnidadCementerio
    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si hay pagos registrados
    const tienePagos = venta.cuotas.some(cuota => cuota.montoPagado > 0)
    console.log('🔍 API Eliminar Venta - Verificación de pagos:', {
      cuotas: venta.cuotas.length,
      cuotasConPagos: venta.cuotas.filter(cuota => cuota.montoPagado > 0).length,
      tienePagos,
      detallesCuotas: venta.cuotas.map(c => ({ id: c.id, montoPagado: c.montoPagado, estado: c.estado }))
    })
    
    if (tienePagos) {
      console.log('❌ API Eliminar Venta - Venta con pagos registrados')
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la venta porque tiene pagos registrados. Use el sistema de cancelaciones en su lugar.' 
        },
        { status: 400 }
      )
    }

    // Verificar si hay comprobantes de pago
    console.log('🔍 API Eliminar Venta - Verificación de comprobantes:', {
      comprobantes: venta.comprobantesPago.length
    })
    
    if (venta.comprobantesPago.length > 0) {
      console.log('❌ API Eliminar Venta - Venta con comprobantes de pago')
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la venta porque tiene comprobantes de pago registrados. Use el sistema de cancelaciones en su lugar.' 
        },
        { status: 400 }
      )
    }

    // Verificar si hay contratos
    if (venta.contratos.length > 0) {
      console.log('❌ API Eliminar Venta - Venta con contratos')
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la venta porque tiene contratos registrados. Use el sistema de cancelaciones en su lugar.' 
        },
        { status: 400 }
      )
    }

    // Verificar si hay pagos de comisiones
    if (venta.pagosComisiones.length > 0) {
      console.log('❌ API Eliminar Venta - Venta con pagos de comisiones')
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la venta porque tiene pagos de comisiones registrados. Use el sistema de cancelaciones en su lugar.' 
        },
        { status: 400 }
      )
    }

    console.log('✅ API Eliminar Venta - Validaciones pasadas, procediendo a eliminar')

    // Eliminar la venta (las relaciones se eliminan automáticamente por CASCADE)
    if (ventaLote) {
      await prisma.ventaLote.delete({
        where: { id: params.id }
      })
      console.log('✅ API Eliminar Venta - Venta de lote eliminada')
    } else {
      await prisma.ventaUnidadCementerio.delete({
        where: { id: params.id }
      })
      console.log('✅ API Eliminar Venta - Venta de unidad de cementerio eliminada')
    }

    return NextResponse.json({
      message: 'Venta eliminada correctamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 

// PATCH /api/ventas/[id] - Actualizar venta
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
    
    // Verificar si el usuario tiene permisos para actualizar ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar ventas' }, { status: 403 })
    }

    const data = await request.json()

    // Buscar la venta en ambas tablas
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
      include: {
        cuotas: {
          include: {
            pagos: true
          }
        }
      }
    })

    let ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      include: {
        cuotas: {
          include: {
            pagos: true
          }
        }
      }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    const venta = ventaLote || ventaUnidadCementerio
    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo puede actualizar sus propias ventas
      if (venta.vendedorId !== session.user.id) {
        return NextResponse.json(
          { error: 'No tienes permisos para actualizar esta venta' },
          { status: 403 }
        )
      }
    }

    // Validar que no se actualice una venta que ya tiene pagos registrados
    const tienePagos = venta.cuotas.some(cuota => cuota.montoPagado > 0)
    if (tienePagos) {
      return NextResponse.json(
        { 
          error: 'No se puede actualizar la venta porque ya tiene pagos registrados. Use el sistema de cancelaciones en su lugar.' 
        },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedBy: session.user.id
    }

    // Solo permitir actualizar ciertos campos
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones
    if (data.condicionesEspeciales !== undefined) updateData.condicionesEspeciales = data.condicionesEspeciales
    if (data.documentosRequeridos !== undefined) updateData.documentosRequeridos = data.documentosRequeridos

    // Actualizar la venta
    let ventaActualizada
    if (ventaLote) {
      ventaActualizada = await prisma.ventaLote.update({
        where: { id: params.id },
        data: updateData,
        include: {
          lote: {
            include: {
              manzana: {
                include: {
                  proyecto: true
                }
              }
            }
          },
          cliente: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          aprobador: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      })
    } else {
      ventaActualizada = await prisma.ventaUnidadCementerio.update({
        where: { id: params.id },
        data: updateData,
        include: {
          unidadCementerio: {
            include: {
              pabellon: {
                include: {
                  proyecto: true
                }
              }
            }
          },
          cliente: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          aprobador: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      message: 'Venta actualizada correctamente',
      venta: ventaActualizada
    })

  } catch (error) {
    console.error('Error al actualizar venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 