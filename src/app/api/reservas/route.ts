import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { EstadoReserva } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || 'TODOS'
    const proyectoId = searchParams.get('proyectoId') || ''
    const vendedorId = searchParams.get('vendedorId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (search) {
      where.OR = [
        { numeroReserva: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
        { cliente: { dni: { contains: search, mode: 'insensitive' } } },
        { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
        { vendedor: { nombre: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (estado !== 'TODOS') {
      where.estado = estado as EstadoReserva
    }

    if (proyectoId) {
      where.proyectoId = proyectoId
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    // Obtener reservas con relaciones
    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        proyecto: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            estado: true,
          }
        },
        lote: {
          select: {
            id: true,
            codigo: true,
            numero: true,
            area: true,
            precio: true,
            estado: true,
          }
        },
        unidadCementerio: {
          select: {
            id: true,
            codigo: true,
            tipoUnidad: true,
            precio: true,
            estado: true,
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            ruc: true,
            tipoCliente: true,
            razonSocial: true,
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          }
        },
        venta: {
          select: {
            id: true,
            precioVenta: true,
            estado: true,
            fechaVenta: true,
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    })

    // Contar total de registros
    const total = await prisma.reserva.count({ where })

    return NextResponse.json({
      reservas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error al obtener reservas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      proyectoId,
      loteId,
      unidadCementerioId,
      clienteId,
      vendedorId,
      montoReserva,
      fechaVencimiento,
      observaciones,
    } = body

    // Validaciones
    if (!proyectoId || !clienteId || !vendedorId || !montoReserva || !fechaVencimiento) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (!loteId && !unidadCementerioId) {
      return NextResponse.json(
        { error: 'Debe especificar un lote o unidad de cementerio' },
        { status: 400 }
      )
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    })
    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el vendedor existe
    const vendedor = await prisma.usuario.findUnique({
      where: { id: vendedorId }
    })
    if (!vendedor) {
      return NextResponse.json(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar disponibilidad del lote o unidad
    if (loteId) {
      const lote = await prisma.lote.findUnique({
        where: { id: loteId }
      })
      if (!lote) {
        return NextResponse.json(
          { error: 'Lote no encontrado' },
          { status: 404 }
        )
      }
      if (lote.estado !== 'DISPONIBLE') {
        return NextResponse.json(
          { error: 'El lote no está disponible para reserva' },
          { status: 400 }
        )
      }
    }

    if (unidadCementerioId) {
      const unidad = await prisma.unidadCementerio.findUnique({
        where: { id: unidadCementerioId }
      })
      if (!unidad) {
        return NextResponse.json(
          { error: 'Unidad de cementerio no encontrada' },
          { status: 404 }
        )
      }
      if (unidad.estado !== 'DISPONIBLE') {
        return NextResponse.json(
          { error: 'La unidad no está disponible para reserva' },
          { status: 400 }
        )
      }
    }

    // Generar número de reserva
    const fecha = new Date()
    const numeroReserva = `RES-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

    // Crear la reserva
    const reserva = await prisma.reserva.create({
      data: {
        numeroReserva,
        proyectoId,
        loteId,
        unidadCementerioId,
        clienteId,
        vendedorId,
        montoReserva,
        fechaVencimiento: new Date(fechaVencimiento),
        observaciones,
        createdBy: session.user.id,
      },
      include: {
        proyecto: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            estado: true,
          }
        },
        lote: {
          select: {
            id: true,
            codigo: true,
            numero: true,
            area: true,
            precio: true,
            estado: true,
          }
        },
        unidadCementerio: {
          select: {
            id: true,
            codigo: true,
            tipoUnidad: true,
            precio: true,
            estado: true,
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            ruc: true,
            tipoCliente: true,
            razonSocial: true,
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
      }
    })

    return NextResponse.json({
      message: 'Reserva creada exitosamente',
      reserva
    })

  } catch (error) {
    console.error('Error al crear reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 