import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/proyectos/[proyectoId]
export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { proyectoId } = params

    if (!proyectoId) {
      return NextResponse.json({ error: 'ID de proyecto no proporcionado' }, { status: 400 })
    }

    // Obtener proyecto con relaciones básicas
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        empresaDesarrolladora: true,
        gerente: true,
        manzanas: {
          include: {
            lotes: true
          }
        },
        pabellones: {
          include: {
            unidades: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Obtener campos PostGIS usando consulta SQL directa
    const geometriaResult = await prisma.$queryRaw<[{
      geometria: string | null
      area_geometrica: number | null
      centro: string | null
      perimetro: string | null
    }]>`
      SELECT 
        ST_AsText(geometria) as geometria,
        "area_geometrica",
        ST_AsText(centro) as centro,
        ST_AsText(perimetro) as perimetro
      FROM proyectos 
      WHERE id = ${proyectoId}
    `

    // Combinar datos del proyecto con geometría PostGIS
    const proyectoConGeometria = {
      ...proyecto,
      geometria: geometriaResult[0]?.geometria || null,
      areaGeometrica: geometriaResult[0]?.area_geometrica || null,
      centro: geometriaResult[0]?.centro || null,
      perimetroGeometrico: geometriaResult[0]?.perimetro || null
    }

    return NextResponse.json(proyectoConGeometria)
  } catch (error) {
    console.error('Error al obtener proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/proyectos/[proyectoId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { proyectoId } = params
    const body = await request.json()

    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: proyectoId },
      data: body
    })

    return NextResponse.json(proyectoActualizado)
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/proyectos/[proyectoId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { proyectoId } = params

    await prisma.proyecto.delete({
      where: { id: proyectoId }
    })

    return NextResponse.json({ message: 'Proyecto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
