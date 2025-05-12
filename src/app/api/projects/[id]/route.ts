import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      location,
      startDate,
      endDate,
      budget,
      type,
      totalArea,
      usableArea,
      totalUnits,
      developerCompanyId
    } = body

    const project = await prisma.proyecto.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget,
        type,
        totalArea,
        usableArea,
        totalUnits,
        developerCompanyId
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    await prisma.proyecto.delete({
      where: {
        id: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 