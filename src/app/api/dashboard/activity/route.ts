import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getRecentActivity } from '@/lib/db-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener empresaId de la sesión del usuario
    const empresaId = (session.user as any).empresaId || null
    
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