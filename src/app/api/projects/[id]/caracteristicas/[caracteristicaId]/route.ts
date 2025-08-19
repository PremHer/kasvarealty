import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; caracteristicaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { nombre, descripcion, activa, orden } = data

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la característica es obligatorio' },
        { status: 400 }
      )
    }

    const caracteristica = await prisma.caracteristicaProyecto.update({
      where: { id: params.caracteristicaId },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activa: activa !== undefined ? activa : true,
        orden: orden !== undefined ? orden : 0
      }
    })

    return NextResponse.json(caracteristica)
  } catch (error) {
    console.error('Error al actualizar característica:', error)
    return NextResponse.json(
      { error: 'Error al actualizar característica' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; caracteristicaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.caracteristicaProyecto.delete({
      where: { id: params.caracteristicaId }
    })

    return NextResponse.json({ message: 'Característica eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar característica:', error)
    return NextResponse.json(
      { error: 'Error al eliminar característica' },
      { status: 500 }
    )
  }
}
