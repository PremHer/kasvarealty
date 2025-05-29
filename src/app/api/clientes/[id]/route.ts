import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { UpdateClienteData } from '@/types/cliente'

// GET /api/clientes/[id] - Obtener un cliente específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

// PATCH /api/clientes/[id] - Actualizar parcialmente un cliente
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { estado } = body

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        estado,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar estado del cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado del cliente' },
      { status: 500 }
    )
  }
}

// PUT /api/clientes/[id] - Actualizar un cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      tipo,
      estado,
      dni,
      fechaNacimiento,
      estadoCivil,
      ocupacion,
      razonSocial,
      ruc,
      representanteLegal,
      cargoRepresentante,
    } = body

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el email ya existe (excluyendo el cliente actual)
    if (email !== existingCliente.email) {
      const existingEmail = await prisma.cliente.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI o RUC ya existe según el tipo
    if (tipo === 'INDIVIDUAL' && dni && dni !== existingCliente.dni) {
      const existingDNI = await prisma.cliente.findFirst({
        where: { dni },
      })
      if (existingDNI) {
        return NextResponse.json(
          { error: 'El DNI ya está registrado' },
          { status: 400 }
        )
      }
    }

    if (tipo === 'EMPRESA' && ruc && ruc !== existingCliente.ruc) {
      const existingRUC = await prisma.cliente.findFirst({
        where: { ruc },
      })
      if (existingRUC) {
        return NextResponse.json(
          { error: 'El RUC ya está registrado' },
          { status: 400 }
        )
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        direccion: direccion || null,
        tipo,
        estado: estado || 'ACTIVO',
        // Campos para cliente individual
        dni: dni || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estadoCivil: estadoCivil || null,
        ocupacion: ocupacion || null,
        // Campos para empresa
        razonSocial: razonSocial || null,
        ruc: ruc || null,
        representanteLegal: representanteLegal || null,
        cargoRepresentante: cargoRepresentante || null,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE /api/clientes/[id] - Eliminar un cliente
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    await prisma.cliente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
} 