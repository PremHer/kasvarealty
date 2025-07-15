import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// PUT /api/notificaciones/marcar-todas-leidas - Marcar todas las notificaciones como leídas
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id

    // Marcar todas las notificaciones del usuario como leídas
    const result = await prisma.notificacion.updateMany({
      where: {
        usuarioId: userId,
        leida: false
      },
      data: {
        leida: true,
        fechaLectura: new Date()
      }
    })

    return NextResponse.json({
      notificacionesActualizadas: result.count,
      message: `${result.count} notificaciones marcadas como leídas`
    })

  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 