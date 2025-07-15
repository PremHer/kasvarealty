import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/ventas/unidades-cementerio-disponibles - Obtener todas las unidades de cementerio disponibles para venta
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const unidades = await prisma.unidadCementerio.findMany({
      where: {
        estado: 'DISPONIBLE'
      },
      include: {
        pabellon: {
          include: {
            proyecto: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        parcela: true,
        nicho: true,
        mausoleo: true
      },
      orderBy: [
        { pabellon: { proyecto: { nombre: 'asc' } } },
        { pabellon: { nombre: 'asc' } },
        { codigo: 'asc' }
      ]
    })

    const unidadesFormateadas = unidades.map(unidad => ({
      id: unidad.id,
      codigo: unidad.codigo,
      precio: unidad.precio || 0,
      estado: unidad.estado,
      tipoUnidad: unidad.tipoUnidad,
      pabellon: {
        nombre: unidad.pabellon.nombre,
        proyecto: {
          id: unidad.pabellon.proyecto.id,
          nombre: unidad.pabellon.proyecto.nombre
        }
      }
    }))

    return NextResponse.json(unidadesFormateadas)
  } catch (error) {
    console.error('Error al obtener unidades de cementerio disponibles:', error)
    return NextResponse.json(
      { error: 'Error al obtener unidades de cementerio disponibles' },
      { status: 500 }
    )
  }
} 