import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PabellonService } from '@/lib/services/pabellonService'

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const estadisticas = await PabellonService.obtenerEstadisticasProyecto(params.proyectoId)
    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error al obtener estadísticas de pabellones:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 