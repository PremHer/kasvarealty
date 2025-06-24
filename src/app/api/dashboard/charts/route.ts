import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getChartData } from '@/lib/db-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener empresaId de la sesión del usuario
    const empresaId = (session.user as any).empresaId || null
    
    const chartData = await getChartData(empresaId)
    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de gráficos' },
      { status: 500 }
    )
  }
} 