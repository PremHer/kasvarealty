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

    console.log('🔍 Debug Cuota - Buscando cuota con ID:', params.id)

    // Buscar la cuota con toda la información de la venta
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          select: {
            id: true,
            estado: true,
            createdAt: true,
            fechaAprobacion: true,
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
        },
        ventaUnidadCementerio: {
          select: {
            id: true,
            estado: true,
            createdAt: true,
            fechaAprobacion: true,
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
        }
      }
    })

    if (!cuota) {
      return NextResponse.json({ 
        error: 'Cuota no encontrada',
        cuotaId: params.id
      }, { status: 404 })
    }

    const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
    const tipoVenta = cuota.ventaLote ? 'VentaLote' : cuota.ventaUnidadCementerio ? 'VentaUnidadCementerio' : null

    console.log('🔍 Debug Cuota - Resultado:', {
      cuotaId: cuota.id,
      numeroCuota: cuota.numeroCuota,
      monto: cuota.monto,
      montoPagado: cuota.montoPagado,
      estado: cuota.estado,
      ventaLoteId: cuota.ventaLoteId,
      ventaUnidadCementerioId: cuota.ventaUnidadCementerioId,
      ventaEncontrada: !!venta,
      tipoVenta,
      ventaEstado: venta?.estado,
      tipoEstado: typeof venta?.estado
    })

    // Hacer pruebas de comparación
    const comparaciones = {
      esAprobada: venta?.estado === 'APROBADA',
      esAprobadaStrict: venta?.estado === 'APROBADA',
      esAprobadaLowerCase: venta?.estado?.toLowerCase() === 'aprobada',
      esAprobadaTrim: venta?.estado?.trim() === 'APROBADA',
      longitudEstado: venta?.estado?.length,
      codigosAscii: venta?.estado?.split('').map(c => c.charCodeAt(0)),
      incluyeEspacios: venta?.estado?.includes(' '),
      incluyeTabs: venta?.estado?.includes('\t'),
      incluyeNewlines: venta?.estado?.includes('\n'),
      incluyeCarriageReturn: venta?.estado?.includes('\r')
    }

    console.log('🔍 Debug Cuota - Comparaciones:', comparaciones)

    return NextResponse.json({
      cuota: {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        monto: cuota.monto,
        montoPagado: cuota.montoPagado,
        estado: cuota.estado,
        ventaLoteId: cuota.ventaLoteId,
        ventaUnidadCementerioId: cuota.ventaUnidadCementerioId
      },
      venta: venta ? {
        id: venta.id,
        tipo: tipoVenta,
        estado: venta.estado,
        tipoEstado: typeof venta.estado,
        fechaCreacion: venta.createdAt,
        fechaAprobacion: venta.fechaAprobacion,
        cliente: venta.cliente,
        unidad: tipoVenta === 'VentaLote' 
          ? cuota.ventaLote?.lote 
          : cuota.ventaUnidadCementerio?.unidadCementerio
      } : null,
      comparaciones,
      diagnosticos: {
        tieneVenta: !!venta,
        esAprobada: venta?.estado === 'APROBADA',
        puedeRegistrarPagos: venta?.estado === 'APROBADA'
      }
    })

  } catch (error) {
    console.error('❌ Debug Cuota - Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 