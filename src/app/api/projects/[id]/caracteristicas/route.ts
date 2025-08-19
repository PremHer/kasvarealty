import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const caracteristicas = await prisma.caracteristicaProyecto.findMany({
      where: { proyectoId: params.id },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json(caracteristicas)
  } catch (error) {
    console.error('Error al obtener características:', error)
    return NextResponse.json(
      { error: 'Error al obtener características' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    const caracteristica = await prisma.caracteristicaProyecto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activa: activa !== undefined ? activa : true,
        orden: orden || 0,
        proyectoId: params.id
      }
    })

    return NextResponse.json(caracteristica, { status: 201 })
  } catch (error) {
    console.error('Error al crear característica:', error)
    return NextResponse.json(
      { error: 'Error al crear característica' },
      { status: 500 }
    )
  }
}
