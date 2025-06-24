import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getDashboardStats, getSystemStats } from '@/lib/db-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Si es SUPER_ADMIN, mostrar estadísticas del sistema completo
    if (session.user.role === 'SUPER_ADMIN') {
      const systemStats = await getSystemStats()
      return NextResponse.json(systemStats)
    }

    // Para otros roles, mostrar estadísticas de la empresa
    const empresaId = (session.user as any).empresaId || null
    const stats = await getDashboardStats(empresaId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
} 