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

    console.log('🔍 Debug Venta - Buscando venta con ID:', params.id)

    // Buscar la venta en ambas tablas
    const ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        lote: {
          select: {
            id: true,
            numero: true,
            manzana: {
              select: {
                nombre: true,
                proyecto: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        unidadCementerio: {
          select: {
            id: true,
            codigo: true,
            pabellon: {
              select: {
                nombre: true,
                proyecto: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const venta = ventaLote || ventaUnidadCementerio
    const tipoVenta = ventaLote ? 'VentaLote' : ventaUnidadCementerio ? 'VentaUnidadCementerio' : null

    console.log('🔍 Debug Venta - Resultado:', {
      encontrada: !!venta,
      tipoVenta,
      estado: venta?.estado,
      tipoEstado: typeof venta?.estado
    })

    if (!venta) {
      return NextResponse.json({ 
        error: 'Venta no encontrada',
        ventaId: params.id
      }, { status: 404 })
    }

    return NextResponse.json({
      venta: {
        id: venta.id,
        tipo: tipoVenta,
        estado: venta.estado,
        tipoEstado: typeof venta.estado,
        fechaCreacion: venta.createdAt,
        fechaAprobacion: venta.updatedAt,
        cliente: venta.cliente,
        unidad: tipoVenta === 'VentaLote' 
          ? ventaLote?.lote 
          : ventaUnidadCementerio?.unidadCementerio
      },
      diagnosticos: {
        esAprobada: venta.estado === 'APROBADA',
        esPendiente: venta.estado === 'PENDIENTE',
        esCancelada: venta.estado === 'CANCELADA',
        esDesaprobada: venta.estado === 'DESAPROBADA',
        esEntregada: venta.estado === 'ENTREGADA',
        esEnProcesoCancelacion: venta.estado === 'EN_PROCESO_CANCELACION'
      }
    })

  } catch (error) {
    console.error('❌ Debug Venta - Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 