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

    const ventaId = params.id

    // Buscar la venta para verificar que existe
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: ventaId }
    })

    let ventaUnidad = null
    let tipoVenta = 'LOTE'

    if (!ventaLote) {
      ventaUnidad = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId }
      })
      tipoVenta = 'UNIDAD_CEMENTERIO'
    }

    if (!ventaLote && !ventaUnidad) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Obtener reprogramaciones con todos los datos relacionados
    const reprogramaciones = await prisma.reprogramacionCuotas.findMany({
      where: {
        OR: [
          { ventaLoteId: ventaId },
          { ventaUnidadCementerioId: ventaId }
        ]
      },
      include: {
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        descuentos: {
          include: {
            cuota: {
              select: {
                numeroCuota: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        modificaciones: {
          include: {
            cuota: {
              select: {
                numeroCuota: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Historial de reprogramaciones obtenido: ${reprogramaciones.length} registros`)

    return NextResponse.json({
      reprogramaciones,
      total: reprogramaciones.length
    })

  } catch (error) {
    console.error('Error al obtener historial de reprogramaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
