import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Roles permitidos para ver estados de lotes
const LOTES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT'
]

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver lotes
    if (!LOTES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver lotes' }, { status: 403 })
    }

    // Buscar el lote
    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        codigo: true,
        estado: true,
        manzana: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            proyecto: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        estado: lote.estado,
        manzana: lote.manzana.nombre,
        manzanaCodigo: lote.manzana.codigo,
        proyecto: lote.manzana.proyecto
      }
    })

  } catch (error) {
    console.error('Error al obtener estado del lote:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 