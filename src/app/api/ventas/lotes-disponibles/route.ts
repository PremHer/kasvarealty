import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/ventas/lotes-disponibles - Obtener todos los lotes disponibles para venta
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const lotes = await prisma.lote.findMany({
      where: {
        estado: 'DISPONIBLE'
      },
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