import { NextResponse } from 'next/server'
import { getUpcomingDeadlines } from '@/lib/db-utils'

export async function GET() {
  try {
    const empresaId = 'empresa-id' // Esto debería venir de la sesión
    const deadlines = await getUpcomingDeadlines(empresaId)
    return NextResponse.json(deadlines)
  } catch (error) {
    console.error('Error obteniendo vencimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener vencimientos' },
      { status: 500 }
    )
  }
} 