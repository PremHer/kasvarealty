import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''
    const tipoVenta = searchParams.get('tipoVenta') || ''

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      proyectoId: params.proyectoId,
    }

    if (search) {
      where.OR = [
        { lote: { codigo: { contains: search, mode: 'insensitive' } } },
        { lote: { numero: { contains: search, mode: 'insensitive' } } },
        { unidadCementerio: { codigo: { contains: search, mode: 'insensitive' } } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
        { vendedor: { nombre: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (estado) {
      where.estado = estado as any
    }

    if (tipoVenta) {
      where.tipoVenta = tipoVenta as any
    }

    // Obtener ventas de lotes
    const ventasLotes = await prisma.ventaLote.findMany({
      where,
      include: {
        lote: {
          include: {
            manzana: true,
          },
        },
        cliente: true,
        vendedor: true,
        aprobador: true,
        proyecto: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Obtener ventas de unidades de cementerio
    const ventasUnidades = await prisma.ventaUnidadCementerio.findMany({
      where: {
        proyectoId: params.proyectoId,
        ...(search && {
          OR: [
            { unidadCementerio: { codigo: { contains: search, mode: 'insensitive' } } },
            { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
            { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
            { vendedor: { nombre: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...(estado && { estado: estado as any }),
        ...(tipoVenta && { tipoVenta: tipoVenta as any }),
      },
      include: {
        unidadCementerio: {
          include: {
            pabellon: true,
          },
        },
        cliente: true,
        vendedor: true,
        aprobador: true,
        proyecto: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Combinar y formatear las ventas
    const ventasCombinadas = [
      ...ventasLotes.map(venta => ({
        ...venta,
        tipo: 'lote',
        loteId: venta.loteId,
        unidadCementerioId: null,
      })),
      ...ventasUnidades.map(venta => ({
        ...venta,
        tipo: 'unidad_cementerio',
        loteId: null,
        unidadCementerioId: venta.unidadCementerioId,
      })),
    ]

    // Contar total
    const totalVentasLotes = await prisma.ventaLote.count({ where })
    const totalVentasUnidades = await prisma.ventaUnidadCementerio.count({
      where: {
        proyectoId: params.proyectoId,
        ...(estado && { estado: estado as any }),
        ...(tipoVenta && { tipoVenta: tipoVenta as any }),
      },
    })

    const total = totalVentasLotes + totalVentasUnidades

    return NextResponse.json({
      ventas: ventasCombinadas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener ventas del proyecto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 