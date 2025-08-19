import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TipoCancelacion, TipoDevolucion, EstadoCancelacion, EstadoVentaLote, EstadoVentaUnidadCementerio } from '@prisma/client'

// GET /api/cancelaciones - Obtener cancelaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ventaLoteId = searchParams.get('ventaLoteId')
    const ventaUnidadCementerioId = searchParams.get('ventaUnidadCementerioId')
    const estado = searchParams.get('estado')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}

    if (ventaLoteId) {
      where.ventaLoteId = ventaLoteId
    }

    if (ventaUnidadCementerioId) {
      where.ventaUnidadCementerioId = ventaUnidadCementerioId
    }

    if (estado) {
      where.estado = estado
    }

    const skip = (page - 1) * limit

    const [cancelaciones, total] = await Promise.all([
      prisma.cancelacionVenta.findMany({
        where,
        include: {
          ventaLote: {
            include: {
              cliente: true,
              lote: true,
              proyecto: true,
              vendedor: true
            }
          },
          ventaUnidadCementerio: {
            include: {
              cliente: true,
              unidadCementerio: true,
              proyecto: true,
              vendedor: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          aprobadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.cancelacionVenta.count({ where })
    ])

    return NextResponse.json({
      cancelaciones,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error al obtener cancelaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener cancelaciones' },
      { status: 500 }
    )
  }
}

// POST /api/cancelaciones - Crear cancelación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para crear cancelaciones
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'FINANCE_MANAGER'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear cancelaciones' }, { status: 403 })
    }

    const body = await request.json()
    const {
      ventaLoteId,
      ventaUnidadCementerioId,
      tipoCancelacion,
      motivoCancelacion,
      tipoDevolucion,
      montoDevolucion,
      porcentajeDevolucion,
      motivoDevolucion,
      observaciones,
      documentosRequeridos,
      condicionesEspeciales
    } = body

    // Validar que se proporcione al menos una venta
    if (!ventaLoteId && !ventaUnidadCementerioId) {
      return NextResponse.json(
        { error: 'Debe especificar una venta de lote o unidad de cementerio' },
        { status: 400 }
      )
    }

    // Validar campos requeridos
    if (!tipoCancelacion || !motivoCancelacion || !tipoDevolucion) {
      return NextResponse.json(
        { error: 'Tipo de cancelación, motivo y tipo de devolución son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la venta existe y no esté ya cancelada
    let venta: any = null
    if (ventaLoteId) {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaLoteId },
        include: { cancelaciones: true }
      })
      
      if (!venta) {
        return NextResponse.json(
          { error: 'Venta de lote no encontrada' },
          { status: 404 }
        )
      }

      if (venta.estado === EstadoVentaLote.CANCELADA) {
        return NextResponse.json(
          { error: 'La venta ya está cancelada' },
          { status: 400 }
        )
      }
    } else if (ventaUnidadCementerioId) {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaUnidadCementerioId },
        include: { cancelaciones: true }
      })
      
      if (!venta) {
        return NextResponse.json(
          { error: 'Venta de unidad de cementerio no encontrada' },
          { status: 404 }
        )
      }

      if (venta.estado === EstadoVentaUnidadCementerio.CANCELADA) {
        return NextResponse.json(
          { error: 'La venta ya está cancelada' },
          { status: 400 }
        )
      }
    }

    // Crear la cancelación
    const cancelacion = await prisma.cancelacionVenta.create({
      data: {
        ventaLoteId,
        ventaUnidadCementerioId,
        tipoCancelacion,
        motivoCancelacion,
        tipoDevolucion,
        montoDevolucion,
        porcentajeDevolucion,
        motivoDevolucion,
        observaciones,
        documentosRequeridos,
        condicionesEspeciales,
        estado: EstadoCancelacion.SOLICITADA,
        createdBy: session.user.id
      },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true,
            proyecto: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true,
            proyecto: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    // Actualizar el estado de la venta a EN_PROCESO_CANCELACION
    if (ventaLoteId) {
      await prisma.ventaLote.update({
        where: { id: ventaLoteId },
        data: { estado: EstadoVentaLote.EN_PROCESO_CANCELACION }
      })
    } else if (ventaUnidadCementerioId) {
      await prisma.ventaUnidadCementerio.update({
        where: { id: ventaUnidadCementerioId },
        data: { estado: EstadoVentaUnidadCementerio.EN_PROCESO_CANCELACION }
      })
    }

    return NextResponse.json(cancelacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear cancelación:', error)
    return NextResponse.json(
      { error: 'Error al crear cancelación' },
      { status: 500 }
    )
  }
} 