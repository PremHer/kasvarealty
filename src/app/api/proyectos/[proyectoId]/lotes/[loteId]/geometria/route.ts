import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Roles que pueden editar geometrías de lotes
const LOTES_ROLES = ['GERENTE_GENERAL', 'PROJECT_MANAGER']

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!LOTES_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId, loteId } = params

    const lote = await prisma.lote.findFirst({
      where: { 
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      },
      select: {
        id: true,
        codigo: true,
        numero: true,
        latitud: true,
        longitud: true,
        dimensionFrente: true,
        dimensionFondo: true
      }
    })

    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    return NextResponse.json(lote)
  } catch (error) {
    console.error('Error al obtener geometría del lote:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!LOTES_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId, loteId } = params
    const { geometria } = await request.json()

    if (!geometria) {
      return NextResponse.json({ error: 'Geometría requerida' }, { status: 400 })
    }

    // Validar formato WKT
    if (!geometria.startsWith('POLYGON((') || !geometria.endsWith('))')) {
      return NextResponse.json({ error: 'Formato WKT inválido' }, { status: 400 })
    }

    // Verificar que el lote pertenece al proyecto
    const loteExistente = await prisma.lote.findFirst({
      where: { 
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      }
    })

    if (!loteExistente) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    // Actualizar lote con geometría y calcular propiedades espaciales
    const loteActualizado = await prisma.$executeRaw`
      UPDATE "Lote" 
      SET 
        geometria = ST_GeomFromText(${geometria}, 4326),
        "areaGeometrica" = ST_Area(ST_GeomFromText(${geometria}, 4326)),
        centro = ST_Centroid(ST_GeomFromText(${geometria}, 4326)),
        "perimetroGeometrico" = ST_Perimeter(ST_GeomFromText(${geometria}, 4326))
      WHERE id = ${loteId}
    `

    if (loteActualizado === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    // Obtener el lote actualizado
    const lote = await prisma.lote.findFirst({
      where: { 
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      },
      select: {
        id: true,
        codigo: true,
        numero: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Geometría del lote actualizada correctamente',
      lote
    })
  } catch (error) {
    console.error('Error al actualizar geometría del lote:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

