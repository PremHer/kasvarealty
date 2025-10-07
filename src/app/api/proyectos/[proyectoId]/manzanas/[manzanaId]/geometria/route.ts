import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Roles que pueden editar geometrías de manzanas
const MANZANAS_ROLES = ['GERENTE_GENERAL', 'PROJECT_MANAGER']

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!MANZANAS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId, manzanaId } = params

    const manzana = await prisma.manzana.findFirst({
      where: { 
        id: manzanaId,
        proyectoId: proyectoId
      },
      select: {
        id: true,
        nombre: true
      }
    })

    if (!manzana) {
      return NextResponse.json({ error: 'Manzana no encontrada' }, { status: 404 })
    }

    return NextResponse.json(manzana)
  } catch (error) {
    console.error('Error al obtener geometría de la manzana:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!MANZANAS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId, manzanaId } = params
    const { geometria } = await request.json()

    if (!geometria) {
      return NextResponse.json({ error: 'Geometría requerida' }, { status: 400 })
    }

    // Validar formato WKT
    if (!geometria.startsWith('POLYGON((') || !geometria.endsWith('))')) {
      return NextResponse.json({ error: 'Formato WKT inválido' }, { status: 400 })
    }

    // Verificar que la manzana pertenece al proyecto
    const manzanaExistente = await prisma.manzana.findFirst({
      where: { 
        id: manzanaId,
        proyectoId: proyectoId
      }
    })

    if (!manzanaExistente) {
      return NextResponse.json({ error: 'Manzana no encontrada' }, { status: 404 })
    }

    // Actualizar manzana con geometría y calcular propiedades espaciales
    const manzanaActualizada = await prisma.$executeRaw`
      UPDATE "Manzana" 
      SET 
        geometria = ST_GeomFromText(${geometria}, 4326),
        "areaGeometrica" = ST_Area(ST_GeomFromText(${geometria}, 4326)),
        centro = ST_Centroid(ST_GeomFromText(${geometria}, 4326)),
        "perimetroGeometrico" = ST_Perimeter(ST_GeomFromText(${geometria}, 4326))
      WHERE id = ${manzanaId} AND "proyectoId" = ${proyectoId}
    `

    if (manzanaActualizada === 0) {
      return NextResponse.json({ error: 'Manzana no encontrada' }, { status: 404 })
    }

    // Obtener la manzana actualizada
    const manzana = await prisma.manzana.findFirst({
      where: { 
        id: manzanaId,
        proyectoId: proyectoId
      },
      select: {
        id: true,
        nombre: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Geometría de la manzana actualizada correctamente',
      manzana
    })
  } catch (error) {
    console.error('Error al actualizar geometría de la manzana:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

