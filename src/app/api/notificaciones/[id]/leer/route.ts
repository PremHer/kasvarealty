import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// PUT /api/notificaciones/[id]/leer - Marcar notificación como leída
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Actualizar notificación
    const notificacion = await prisma.notificacion.update({
      where: {
        id: id
      },
      data: {
        leida: true,
        fechaLectura: new Date()
      }
    })

    return NextResponse.json({
      notificacion,
      message: 'Notificación marcada como leída'
    })

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 