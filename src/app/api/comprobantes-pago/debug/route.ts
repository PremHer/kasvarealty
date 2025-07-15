import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todos los comprobantes
    const comprobantes = await prisma.comprobantePago.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('=== DEBUG TODOS LOS COMPROBANTES ===')
    console.log('Total de comprobantes en BD:', comprobantes.length)
    
    comprobantes.forEach((comp, index) => {
      console.log(`Comprobante ${index + 1}:`, {
        id: comp.id,
        tipo: comp.tipo,
        monto: comp.monto,
        ventaLoteId: comp.ventaLoteId,
        ventaUnidadCementerioId: comp.ventaUnidadCementerioId,
        nombreArchivo: comp.nombreArchivo,
        createdAt: comp.createdAt
      })
    })

    return NextResponse.json({
      total: comprobantes.length,
      comprobantes: comprobantes.map(c => ({
        id: c.id,
        tipo: c.tipo,
        monto: c.monto,
        ventaLoteId: c.ventaLoteId,
        ventaUnidadCementerioId: c.ventaUnidadCementerioId,
        nombreArchivo: c.nombreArchivo,
        createdAt: c.createdAt
      }))
    })

  } catch (error) {
    console.error('Error al obtener comprobantes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 