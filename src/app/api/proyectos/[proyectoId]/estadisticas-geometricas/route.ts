import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GeometriaService } from '@/lib/services/geometriaService';

// GET /api/proyectos/[proyectoId]/estadisticas-geometricas
export async function GET(
  request: Request,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { proyectoId } = params;

    if (!proyectoId) {
      return new NextResponse('ID de proyecto no proporcionado', { status: 400 });
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Obtener estadísticas usando consultas SQL directas para campos geométricos
    const estadisticasResult = await prisma.$queryRaw<[{
      total_area: number
      total_lotes: number
      lotes_con_geometria: number
      manzanas_con_geometria: number
    }]>`
      SELECT 
        COALESCE(SUM(m."area_geometrica"), 0)::float8 as total_area,
        COUNT(l.id)::int as total_lotes,
        COUNT(l.geometria)::int as lotes_con_geometria,
        COUNT(m.geometria)::int as manzanas_con_geometria
      FROM manzanas m
      LEFT JOIN lotes l ON m.id = l."manzanaId"
      WHERE m."proyectoId" = ${proyectoId}
    `

    const estadisticas = estadisticasResult[0];

    // Obtener información adicional del proyecto usando Prisma para campos no geométricos
    const totalManzanas = await prisma.manzana.count({
      where: { proyectoId }
    });

    const totalLotes = await prisma.lote.count({
      where: {
        manzana: {
          proyectoId
        }
      }
    });

    // Usar consultas SQL para contar elementos con geometría
    const manzanasConGeometriaResult = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM manzanas
      WHERE "proyectoId" = ${proyectoId} AND geometria IS NOT NULL
    `;

    const lotesConGeometriaResult = await prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM lotes l
      INNER JOIN manzanas m ON l."manzanaId" = m.id
      WHERE m."proyectoId" = ${proyectoId} AND l.geometria IS NOT NULL
    `;

    const manzanasConGeometria = manzanasConGeometriaResult[0].count;
    const lotesConGeometria = lotesConGeometriaResult[0].count;

    return NextResponse.json({
      estadisticas,
      resumen: {
        totalManzanas,
        totalLotes,
        manzanasConGeometria,
        lotesConGeometria,
        porcentajeManzanasConGeometria: totalManzanas > 0 ? (manzanasConGeometria / totalManzanas * 100).toFixed(1) : 0,
        porcentajeLotesConGeometria: totalLotes > 0 ? (lotesConGeometria / totalLotes * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas geométricas:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

