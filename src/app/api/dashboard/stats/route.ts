import { NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/db-utils'

export async function GET() {
  try {
    const empresaId = 'empresa-id' // Esto debería venir de la sesión
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