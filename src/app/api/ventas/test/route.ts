import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/ventas/test - Endpoint de prueba
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Contar lotes disponibles
    const lotesCount = await prisma.lote.count({
      where: { estado: 'DISPONIBLE' }
    })

    // Contar unidades de cementerio disponibles
    const unidadesCount = await prisma.unidadCementerio.count({
      where: { estado: 'DISPONIBLE' }
    })

    return NextResponse.json({
      message: 'API funcionando correctamente',
      user: session.user.email,
      lotesDisponibles: lotesCount,
      unidadesDisponibles: unidadesCount
    })
  } catch (error) {
    console.error('Error en endpoint de prueba:', error)
    return NextResponse.json(
      { error: 'Error en endpoint de prueba', details: error },
      { status: 500 }
    )
  }
} 