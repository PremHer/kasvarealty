import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ventas/test-db - Endpoint de prueba de base de datos
export async function GET() {
  try {
    // Probar conexión a la base de datos
    await prisma.$connect()
    
    // Contar registros en diferentes tablas
    const lotesCount = await prisma.lote.count()
    const unidadesCount = await prisma.unidadCementerio.count()
    const clientesCount = await prisma.cliente.count()
    const ventasLotesCount = await prisma.ventaLote.count()
    const ventasUnidadesCount = await prisma.ventaUnidadCementerio.count()

    return NextResponse.json({
      message: 'Conexión a base de datos exitosa',
      stats: {
        lotes: lotesCount,
        unidadesCementerio: unidadesCount,
        clientes: clientesCount,
        ventasLotes: ventasLotesCount,
        ventasUnidadesCementerio: ventasUnidadesCount
      }
    })
  } catch (error) {
    console.error('Error en prueba de base de datos:', error)
    return NextResponse.json(
      { error: 'Error en conexión a base de datos', details: error },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 