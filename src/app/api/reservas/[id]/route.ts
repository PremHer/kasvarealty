import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { EstadoReserva } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    const reserva = await prisma.reserva.findUnique({
      where: { id },
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
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
      }
    })

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(reserva)

  } catch (error) {
    console.error('Error al obtener reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const {
      montoReserva,
      fechaVencimiento,
      estado,
      observaciones,
    } = body

    // Verificar que la reserva existe
    const reservaExistente = await prisma.reserva.findUnique({
      where: { id }
    })

    if (!reservaExistente) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Validar que no se pueda modificar una reserva convertida
    if (reservaExistente.estado === 'CONVERTIDA') {
      return NextResponse.json(
        { error: 'No se puede modificar una reserva convertida a venta' },
        { status: 400 }
      )
    }

    // Actualizar la reserva
    const reserva = await prisma.reserva.update({
      where: { id },
      data: {
        montoReserva: montoReserva ? parseFloat(montoReserva) : undefined,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        estado: estado as EstadoReserva,
        observaciones,
        updatedBy: session.user.id,
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
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
      }
    })

    return NextResponse.json({
      message: 'Reserva actualizada exitosamente',
      reserva
    })

  } catch (error) {
    console.error('Error al actualizar reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = params

    // Verificar que la reserva existe
    const reserva = await prisma.reserva.findUnique({
      where: { id }
    })

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Validar que no se pueda eliminar una reserva convertida
    if (reserva.estado === 'CONVERTIDA') {
      return NextResponse.json(
        { error: 'No se puede eliminar una reserva convertida a venta' },
        { status: 400 }
      )
    }

    // Eliminar la reserva
    await prisma.reserva.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Reserva eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar reserva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 