import { NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/db-utils'

export async function GET() {
  try {
    const empresaId = 'empresa-id' // Esto debería venir de la sesión
    const activity = await getRecentActivity(empresaId)
    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error obteniendo actividad:', error)
    return NextResponse.json(
      { error: 'Error al obtener actividad' },
      { status: 500 }
    )
  }
} 