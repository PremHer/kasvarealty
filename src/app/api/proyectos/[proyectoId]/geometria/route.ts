import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Roles que pueden editar geometrías de proyectos
const PROYECTOS_ROLES = ['GERENTE_GENERAL', 'PROJECT_MANAGER']

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!PROYECTOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId } = params

    // Obtener geometría usando consulta SQL directa ya que Prisma no maneja bien los campos PostGIS
    const geometriaResult = await prisma.$queryRaw<[{
      id: string
      geometria: string | null
      latitud: number | null
      longitud: number | null
      area_geometrica: number | null
      centro: string | null
      perimetro: string | null
    }]>`
      SELECT 
        id,
        ST_AsText(geometria) as geometria,
        latitud,
        longitud,
        "area_geometrica",
        ST_AsText(centro) as centro,
        ST_AsText(perimetro) as perimetro
      FROM proyectos 
      WHERE id = ${proyectoId}
    `

    if (geometriaResult.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const proyecto = geometriaResult[0]

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(proyecto)
  } catch (error) {
    console.error('Error al obtener geometría del proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!PROYECTOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { proyectoId } = params
    const { geometria } = await request.json()

    if (!geometria) {
      return NextResponse.json({ error: 'Geometría requerida' }, { status: 400 })
    }

    // Validar formato WKT
    if (!geometria.startsWith('POLYGON((') || !geometria.endsWith('))')) {
      return NextResponse.json({ error: 'Formato WKT inválido' }, { status: 400 })
    }

    console.log('🔍 Debug - Actualizando geometría del proyecto:', { proyectoId, geometria })
    
    // Actualizar proyecto con geometría y calcular propiedades espaciales
    const proyectoActualizado = await prisma.$executeRaw`
      UPDATE proyectos 
      SET 
        geometria = ST_GeomFromText(${geometria}, 4326),
        "area_geometrica" = ST_Area(ST_GeomFromText(${geometria}, 4326)),
        centro = ST_Centroid(ST_GeomFromText(${geometria}, 4326)),
        perimetro = ST_Boundary(ST_GeomFromText(${geometria}, 4326))
      WHERE id = ${proyectoId}
    `
    
    console.log('✅ Debug - Geometría actualizada, filas afectadas:', proyectoActualizado)

    if (proyectoActualizado === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Obtener el proyecto actualizado usando consulta SQL directa
    const proyectoActualizadoResult = await prisma.$queryRaw<[{
      id: string
      geometria: string | null
      area_geometrica: number | null
      centro: string | null
      perimetro: string | null
    }]>`
      SELECT 
        id,
        ST_AsText(geometria) as geometria,
        "area_geometrica",
        ST_AsText(centro) as centro,
        ST_AsText(perimetro) as perimetro
      FROM proyectos 
      WHERE id = ${proyectoId}
    `

    const proyecto = proyectoActualizadoResult[0]

    return NextResponse.json({
      success: true,
      message: 'Geometría del proyecto actualizada correctamente',
      proyecto
    })
  } catch (error) {
    console.error('Error al actualizar geometría del proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
