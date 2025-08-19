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

    console.log('🔍 Debug Venta Simple - Buscando cuota con ID:', params.id)

    // Buscar la cuota
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        numeroCuota: true,
        ventaLoteId: true,
        ventaUnidadCementerioId: true
      }
    })

    if (!cuota) {
      return NextResponse.json({ 
        error: 'Cuota no encontrada',
        cuotaId: params.id
      }, { status: 404 })
    }

    console.log('🔍 Debug Venta Simple - Cuota encontrada:', {
      id: cuota.id,
      numeroCuota: cuota.numeroCuota,
      ventaLoteId: cuota.ventaLoteId,
      ventaUnidadCementerioId: cuota.ventaUnidadCementerioId
    })

    let ventaInfo = null
    let tipoVenta = null

    // Buscar la venta correspondiente
    if (cuota.ventaLoteId) {
      const ventaLote = await prisma.ventaLote.findUnique({
        where: { id: cuota.ventaLoteId },
        select: {
          id: true,
          estado: true,
          createdAt: true,
          fechaAprobacion: true
        }
      })
      
      if (ventaLote) {
        ventaInfo = ventaLote
        tipoVenta = 'VentaLote'
      }
    } else if (cuota.ventaUnidadCementerioId) {
      const ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: cuota.ventaUnidadCementerioId },
        select: {
          id: true,
          estado: true,
          createdAt: true,
          fechaAprobacion: true
        }
      })
      
      if (ventaUnidadCementerio) {
        ventaInfo = ventaUnidadCementerio
        tipoVenta = 'VentaUnidadCementerio'
      }
    }

    console.log('🔍 Debug Venta Simple - Venta encontrada:', {
      ventaInfo,
      tipoVenta
    })

    if (!ventaInfo) {
      return NextResponse.json({ 
        error: 'Venta no encontrada para esta cuota',
        cuota: cuota
      }, { status: 404 })
    }

    // Análisis del estado
    const estadoOriginal = ventaInfo.estado
    const estadoLimpio = estadoOriginal?.toString().trim().toUpperCase()
    const esAprobada = estadoLimpio === 'APROBADA'

    console.log('🔍 Debug Venta Simple - Análisis del estado:', {
      estadoOriginal,
      estadoLimpio,
      esAprobada,
      tipoEstado: typeof estadoOriginal,
      longitud: estadoOriginal?.length,
      codigosAscii: estadoOriginal?.split('').map(c => c.charCodeAt(0))
    })

    return NextResponse.json({
      cuota: {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota
      },
      venta: {
        id: ventaInfo.id,
        tipo: tipoVenta,
        estado: estadoOriginal,
        estadoLimpio,
        esAprobada,
        fechaCreacion: ventaInfo.createdAt,
        fechaAprobacion: ventaInfo.fechaAprobacion
      },
      puedeRegistrarPagos: esAprobada
    })

  } catch (error) {
    console.error('❌ Debug Venta Simple - Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 