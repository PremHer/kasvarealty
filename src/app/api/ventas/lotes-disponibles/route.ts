import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/ventas/lotes-disponibles - Obtener todos los lotes disponibles para venta
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener query parameters
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    // Construir where clause
    const whereClause: any = {
      estado: 'DISPONIBLE'
    }

    // Si se proporciona proyectoId, filtrar por proyecto
    if (proyectoId) {
      whereClause.manzana = {
        proyecto: {
          id: proyectoId
        }
      }
    }

    const lotes = await prisma.lote.findMany({
      where: whereClause,
      include: {
        manzana: {
          include: {
            proyecto: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: [
        { manzana: { proyecto: { nombre: 'asc' } } },
        { manzana: { nombre: 'asc' } },
        { codigo: 'asc' }
      ]
    })

    const lotesFormateados = lotes.map(lote => ({
      id: lote.id,
      codigo: lote.codigo,
      precio: lote.precio || 0,
      estado: lote.estado,
      manzana: {
        nombre: lote.manzana.nombre,
        proyecto: {
          id: lote.manzana.proyecto.id,
          nombre: lote.manzana.proyecto.nombre
        }
      }
    }))

    return NextResponse.json(lotesFormateados)
  } catch (error) {
    console.error('Error al obtener lotes disponibles:', error)
    return NextResponse.json(
      { error: 'Error al obtener lotes disponibles' },
      { status: 500 }
    )
  }
} 