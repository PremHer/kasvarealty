import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para ventas
const SALES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'GERENTE_GENERAL'
]

// GET /api/ventas/[id] - Obtener venta específica
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
    
    // Verificar si el usuario tiene permisos para ver ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver ventas' }, { status: 403 })
    }

    // Buscar la venta en ambas tablas
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
      include: {
        lote: {
          include: {
            manzana: {
              include: {
                proyecto: true
              }
            }
          }
        },
        cliente: true,
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    let ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      include: {
        unidadCementerio: {
          include: {
            pabellon: {
              include: {
                proyecto: true
              }
            }
          }
        },
        cliente: true,
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo puede ver sus propias ventas
      if (ventaLote && ventaLote.vendedorId !== session.user.id) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta venta' },
          { status: 403 }
        )
      }
      if (ventaUnidadCementerio && ventaUnidadCementerio.vendedorId !== session.user.id) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta venta' },
          { status: 403 }
        )
      }
    }

    // Retornar la venta encontrada
    if (ventaLote) {
      return NextResponse.json({
        ...ventaLote,
        tipoVenta: 'LOTE',
        unidad: ventaLote.lote
      })
    } else {
      return NextResponse.json({
        ...ventaUnidadCementerio,
        tipoVenta: 'UNIDAD_CEMENTERIO',
        unidad: ventaUnidadCementerio!.unidadCementerio
      })
    }

  } catch (error) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 